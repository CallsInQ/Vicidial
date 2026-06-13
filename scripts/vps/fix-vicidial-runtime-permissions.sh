#!/usr/bin/env bash
set -euo pipefail

repo_root="${1:-/opt/qdialer-vicidial}"
apache_user="${APACHE_USER:-wwwrun}"
apache_group="${APACHE_GROUP:-wwwrun}"
auth_log="${repo_root}/www/vicidial/project_auth_entries.txt"

if [[ ! -d "${repo_root}/www/vicidial" ]]; then
  echo "VICIDIAL web directory was not found under: ${repo_root}" >&2
  exit 1
fi

if [[ ! -e "${auth_log}" ]]; then
  touch "${auth_log}"
fi

chown "${apache_user}:${apache_group}" "${auth_log}"
chmod u+rw "${auth_log}"

echo "VICIDIAL runtime permissions fixed for ${auth_log}"
