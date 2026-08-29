FROM node:22-alpine

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
COPY app/public_site/templates/ /app/public_site/templates/

CMD ["npm", "run", "dev", "--", "--host"]
