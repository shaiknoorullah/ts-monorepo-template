{{- define "lib-chart.otelEnv" -}}
- name: OTEL_SERVICE_NAME
  value: {{ include "lib-chart.fullname" . | quote }}
- name: OTEL_EXPORTER_OTLP_ENDPOINT
  value: {{ .Values.observability.tracing.exporterEndpoint | default "http://otel-collector.observability:4317" | quote }}
- name: OTEL_TRACES_SAMPLER
  value: {{ .Values.observability.tracing.sampler | default "parentbased_traceidratio" | quote }}
- name: OTEL_TRACES_SAMPLER_ARG
  value: {{ .Values.observability.tracing.samplerArg | default "0.1" | quote }}
- name: OTEL_RESOURCE_ATTRIBUTES
  value: {{ printf "service.namespace=%s,deployment.environment=%s" .Release.Namespace (.Values.env | default "dev") | quote }}
{{- end -}}
