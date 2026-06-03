{{- define "lib-chart.otelColSidecar" -}}
{{- $rt := ((.Values.observability).tracing).runtime | default "go" }}
{{- $on := or (and (.Values.otel) (.Values.otel.sidecar) (.Values.otel.sidecar.enabled)) (eq $rt "rust") }}
{{- if $on }}
apiVersion: opentelemetry.io/v1beta1
kind: OpenTelemetryCollector
metadata:
  name: {{ include "lib-chart.fullname" . }}
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
spec:
  mode: sidecar
  config:
    receivers:
      otlp:
        protocols:
          grpc: { endpoint: 0.0.0.0:4317 }
          http: { endpoint: 0.0.0.0:4318 }
    processors:
      memory_limiter:
        check_interval: 1s
        limit_mib: 200
      batch: {}
    exporters:
      otlp:
        endpoint: {{ (((.Values.observability).tracing).exporterEndpoint) | default "otel-collector.observability:4317" | quote }}
        tls: { insecure: true }
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [memory_limiter, batch]
          exporters: [otlp]
{{- end }}
{{- end -}}
