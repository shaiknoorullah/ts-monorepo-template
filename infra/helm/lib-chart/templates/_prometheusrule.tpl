{{- define "lib-chart.prometheusRule" -}}
{{- if and (.Values.observability).alerts .Values.observability.alerts.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: {{ include "lib-chart.fullname" . }}
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
    release: kube-prometheus-stack
spec:
  groups:
    - name: {{ include "lib-chart.fullname" . }}
      rules:
        {{- range .Values.observability.alerts.rules }}
        - alert: {{ .alert }}
          expr: {{ .expr | quote }}
          for: {{ .for | default "5m" }}
          labels:
            severity: {{ .severity | default "warning" }}
          annotations:
            summary: {{ printf "%s firing" .alert | quote }}
        {{- end }}
{{- end }}
{{- end -}}
