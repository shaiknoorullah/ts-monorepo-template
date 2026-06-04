{{- define "lib-chart.httpRoute" -}}
{{- if and .Values.route (eq (.Values.route.kind | default "HTTPRoute") "HTTPRoute") }}
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: {{ include "lib-chart.fullname" . }}
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
spec:
  parentRefs:
{{ toYaml (.Values.route.parentRefs | default list) | indent 4 }}
  hostnames:
{{ toYaml (.Values.route.hostnames | default list) | indent 4 }}
  rules:
    - backendRefs:
        - name: {{ include "lib-chart.fullname" . }}
          port: {{ .Values.service.port | default 8080 }}
{{- end }}
{{- end -}}
