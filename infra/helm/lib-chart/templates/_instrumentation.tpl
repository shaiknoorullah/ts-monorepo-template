{{- define "lib-chart.instrumentation" -}}
{{- $rt := ((.Values.observability).tracing).runtime | default "go" }}
{{- $tracing := (.Values.observability).tracing | default dict }}
{{- if and (ne $rt "rust") (or (not (hasKey $tracing "enabled")) $tracing.enabled) }}
apiVersion: opentelemetry.io/v1alpha1
kind: Instrumentation
metadata:
  name: {{ include "lib-chart.fullname" . }}
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
spec:
  exporter:
    endpoint: {{ $tracing.exporterEndpoint | default "http://otel-collector.observability:4317" | quote }}
  propagators: [tracecontext, baggage]
  sampler:
    type: {{ $tracing.sampler | default "parentbased_traceidratio" }}
    argument: {{ $tracing.samplerArg | default "0.1" | quote }}
  {{- if eq $rt "go" }}
  go:
    image: ghcr.io/open-telemetry/opentelemetry-go-instrumentation/autoinstrumentation-go:v0.16.0
  {{- else if eq $rt "py" }}
  python:
    image: ghcr.io/open-telemetry/opentelemetry-operator/autoinstrumentation-python:0.50b0
  {{- else if eq $rt "node" }}
  nodejs:
    image: ghcr.io/open-telemetry/opentelemetry-operator/autoinstrumentation-nodejs:0.55.0
  {{- end }}
{{- end }}
{{- end -}}
