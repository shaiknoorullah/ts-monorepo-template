{{- define "lib-chart.grafanaDashboardCM" -}}
{{- if and (.Values.observability).dashboards .Values.observability.dashboards.enabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "lib-chart.fullname" . }}-dashboard
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
    grafana_dashboard: "1"
data:
  {{ include "lib-chart.fullname" . }}.json: |
{{ .Values.observability.dashboards.json | indent 4 }}
{{- end }}
{{- end -}}
