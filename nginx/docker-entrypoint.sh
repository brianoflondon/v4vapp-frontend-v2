#!/bin/sh
# Render the CSP snippet, then start nginx with its normal entrypoint.
# Reporting stays off until both URLs are set on the container:
#   CSP_REPORT_URI              report-uri.com /r/d/csp/reportOnly URL
#   CSP_REPORTING_ENDPOINT      report-uri.com Reporting API URL (/a/d/g)
set -eu

valid_https_url() {
  case "$1" in
    *[\ \'\"\;\$\`\\]*)
      return 1
      ;;
    https://*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

suffix=""
reporting_header="# CSP reporting is off. Set CSP_REPORT_URI and CSP_REPORTING_ENDPOINT."

if [ -n "${CSP_REPORT_URI:-}" ]; then
  if ! valid_https_url "$CSP_REPORT_URI"; then
    echo "CSP_REPORT_URI must be an https URL without quotes, spaces, or semicolons" >&2
    exit 1
  fi
  suffix="; report-uri ${CSP_REPORT_URI}"
  if [ -n "${CSP_REPORTING_ENDPOINT:-}" ]; then
    if ! valid_https_url "$CSP_REPORTING_ENDPOINT"; then
      echo "CSP_REPORTING_ENDPOINT must be an https URL without quotes, spaces, or semicolons" >&2
      exit 1
    fi
    suffix="${suffix}; report-to csp-endpoint"
    reporting_header="add_header Reporting-Endpoints 'csp-endpoint=\"${CSP_REPORTING_ENDPOINT}\"' always;"
  else
    reporting_header="# report-uri is set. Set CSP_REPORTING_ENDPOINT to also send Reporting API reports."
  fi
fi

export CSP_REPORT_SUFFIX="$suffix"
export CSP_REPORTING_HEADER="$reporting_header"

mkdir -p /etc/nginx/snippets
envsubst '${CSP_REPORT_SUFFIX} ${CSP_REPORTING_HEADER}' \
  < /etc/nginx/security-headers.conf.template \
  > /etc/nginx/snippets/security-headers.conf

exec /docker-entrypoint.sh "$@"
