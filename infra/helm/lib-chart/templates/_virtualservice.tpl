{{- define "lib-chart.virtualService" -}}
{{- if and .Values.route (eq (.Values.route.kind | default "") "VirtualService") }}
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: {{ include "lib-chart.fullname" . }}
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
spec:
  hosts:
{{ toYaml (.Values.route.hostnames | default list) | indent 4 }}
  gateways:
{{ toYaml (.Values.route.gateways | default list) | indent 4 }}
  http:
    - route:
        - destination:
            host: {{ include "lib-chart.fullname" . }}
            port: { number: {{ .Values.service.port | default 8080 }} }
{{- end }}
{{- end -}}
