import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().with_name('deploy.sh')
MOCK = '''#!/usr/bin/env python3
import json, os, pathlib, sys
args=sys.argv[1:]
root=pathlib.Path(os.environ['MOCK_ROOT'])
with (root/'calls').open('a') as f: f.write(json.dumps([pathlib.Path(sys.argv[0]).name]+args)+'\\n')
scenario=os.environ['SCENARIO']
rollback=any('jobber-rollback.' in a for a in args)
if rollback and 'up' in args: (root/'rollback').touch()
restoring=(root/'rollback').exists()
if pathlib.Path(sys.argv[0]).name=='curl':
    counter=root/'curl-count'
    count=int(counter.read_text()) if counter.exists() else 0
    counter.write_text(str(count+1))
    if scenario=='startup-tls' and count==0: sys.exit(35)
    if scenario=='startup-http' and count==0: print('502'); sys.exit(0)
    print('502' if scenario=='https' and not restoring else '200'); sys.exit(0)
if args[0]=='inspect': print('sha256:'+('a'*64 if args[-1]=='app-id' else 'b'*64)); sys.exit(0)
if 'ps' in args: print(args[-1]+'-id'); sys.exit(0)
if scenario=='pull' and 'pull' in args: sys.exit(1)
if scenario=='start' and 'up' in args and args[-1]=='app' and not rollback: sys.exit(1)
if scenario=='migrate' and 'migrate' in args: sys.exit(1)
if scenario=='readiness' and '-c' in args and not restoring: sys.exit(1)
sys.exit(0)
'''
class DeploymentTests(unittest.TestCase):
    def run_case(self, scenario):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            for command in ('docker','curl'):
                path=root/command; path.write_text(MOCK); path.chmod(0o755)
            path=root/'sleep'; path.write_text('#!/bin/sh\nexit 0\n'); path.chmod(0o755)
            env=dict(os.environ, PATH=f'{root}:'+os.environ['PATH'], MOCK_ROOT=directory, SCENARIO=scenario, IMAGE_TAG='test-release')
            result=subprocess.run(['bash',str(SCRIPT)],env=env,capture_output=True,text=True)
            calls=[json.loads(line) for line in (root/'calls').read_text().splitlines()]
            rollback=[call for call in calls if 'up' in call and any('jobber-rollback.' in arg for arg in call)]
            succeeded=scenario in ('success','startup-tls','startup-http')
            self.assertEqual(result.returncode==0,succeeded,result.stdout+result.stderr)
            self.assertEqual(len(rollback),0 if succeeded or scenario=='pull' else 2)
            if scenario.startswith('startup-'):
                self.assertEqual(len([call for call in calls if call[0]=='curl']),2)
            if rollback:
                self.assertEqual([call[-1] for call in rollback],['app','frontend'])
                self.assertIn('Previous release restored',result.stderr)
            if scenario=='success':
                migration=next(i for i,c in enumerate(calls) if 'migrate' in c)
                replacement=next(i for i,c in enumerate(calls) if 'up' in c)
                self.assertLess(migration,replacement)
            if scenario=='pull': self.assertFalse(any('up' in call for call in calls))
            for call in calls:
                if 'up' in call:
                    self.assertIn('--no-deps',call)
                    self.assertNotIn('db',call)
            self.assertFalse(any(Path(arg).exists() for call in rollback for arg in call if 'jobber-rollback.' in arg))
    def test_success(self): self.run_case('success')
    def test_pull_failure_keeps_services(self): self.run_case('pull')
    def test_container_creation_failure_restores(self): self.run_case('start')
    def test_readiness_failure_restores(self): self.run_case('readiness')
    def test_migration_failure_restores(self): self.run_case('migrate')
    def test_https_failure_restores(self): self.run_case('https')
    def test_https_startup_tls_failure_is_retried(self): self.run_case('startup-tls')
    def test_https_startup_bad_gateway_is_retried(self): self.run_case('startup-http')
unittest.main()
