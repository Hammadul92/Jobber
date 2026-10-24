#!/usr/bin/env bash
set -Eeuo pipefail

: "${IMAGE_TAG:?IMAGE_TAG must identify the built release}"
compose=(docker compose -f docker-compose.prod.yml)
rollback_file=$(mktemp /tmp/jobber-rollback.XXXXXX.json)
mutating=false

wait_for_backend() {
    local attempt
    for attempt in {1..30}; do
        if "${compose[@]}" exec -T app python -c '
import urllib.request
request = urllib.request.Request("http://127.0.0.1:8000/", headers={"Host": "getcontractorz.com", "X-Forwarded-Proto": "https"})
assert urllib.request.urlopen(request, timeout=5).status == 200
'; then
            return 0
        fi
        sleep 2
    done
    return 1
}

check_site() {
    # Test this server directly, including TLS and the Nginx upstream mapping.
    local code attempt
    for attempt in {1..30}; do
        if code=$(curl --silent --show-error --connect-timeout 2 --max-time 5 \
            --resolve getcontractorz.com:443:127.0.0.1 \
            --output /dev/null --write-out '%{http_code}' https://getcontractorz.com/); then
            if [[ "$code" == 200 ]]; then
                return 0
            fi
        fi
        sleep 2
    done
    return 1
}

finish() {
    local status=$?
    trap - EXIT HUP INT TERM
    if (( status != 0 )) && [[ "$mutating" == true ]]; then
        echo "Deployment failed; restoring previous application images." >&2
        "${compose[@]}" logs --tail 50 app frontend || true
        # Do not roll back database migrations: releases must keep schema
        # changes compatible with the previous application version.
        if "${compose[@]}" -f "$rollback_file" up -d --no-deps --pull never --force-recreate app &&
            wait_for_backend &&
            "${compose[@]}" -f "$rollback_file" up -d --no-deps --pull never --force-recreate frontend &&
            check_site; then
            echo "Previous release restored; deployment remains failed." >&2
        else
            echo "Recovery failed; manual intervention required." >&2
        fi
    fi
    rm -f "$rollback_file"
    exit "$status"
}
trap finish EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

# Capture immutable local image IDs before replacing either service. Refuse
# deployment without a recovery target, including when containers are stopped.
app_id=$("${compose[@]}" ps -aq app)
frontend_id=$("${compose[@]}" ps -aq frontend)
previous_app=$(docker inspect --format '{{.Image}}' "${app_id:?No previous backend}")
previous_frontend=$(docker inspect --format '{{.Image}}' "${frontend_id:?No previous frontend}")
printf '{"services":{"app":{"image":"%s"},"frontend":{"image":"%s"}}}\n' \
    "$previous_app" "$previous_frontend" > "$rollback_file"

# Download everything before disrupting the running application. Keep the
# database container untouched during application deployments.
"${compose[@]}" pull app frontend
mutating=true
# Apply compatible migrations with the new image while the old backend still
# serves traffic, before checking HTTP responses from the replacement.
"${compose[@]}" run --rm --no-deps app python manage.py migrate --noinput
"${compose[@]}" up -d --no-deps --pull never --force-recreate app
wait_for_backend
"${compose[@]}" exec -T app python manage.py collectstatic --noinput
"${compose[@]}" up -d --no-deps --pull never --force-recreate frontend
check_site
echo "Deployment completed; backend and HTTPS checks passed."
