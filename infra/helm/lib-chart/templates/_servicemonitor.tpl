{{- define "lib-chart.serviceMonitor" -}}
{{- if and ((.Values.observability).metrics).serviceMonitor (.Values.observability.metrics.serviceMonitor.enabled | default true) }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ include "lib-chart.fullname" . }}
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
    release: kube-prometheus-stack
spec:
  selector:
    matchLabels:
{{ include "lib-chart.selectorLabels" . | indent 6 }}
  endpoints:
    - port: metrics
      path: {{ .Values.observability.metrics.path | default "/metrics" }}
      interval: {{ .Values.observability.metrics.serviceMonitor.interval | default "30s" }}
{{- end }}
{{- end -}}
