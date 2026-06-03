{{- define "lib-chart.podMonitor" -}}
{{- if and ((.Values.observability).metrics).podMonitor .Values.observability.metrics.podMonitor.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: {{ include "lib-chart.fullname" . }}
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
    release: kube-prometheus-stack
spec:
  selector:
    matchLabels:
{{ include "lib-chart.selectorLabels" . | indent 6 }}
  podMetricsEndpoints:
    - port: metrics
      path: {{ .Values.observability.metrics.path | default "/metrics" }}
      interval: {{ .Values.observability.metrics.podMonitor.interval | default "30s" }}
{{- end }}
{{- end -}}
