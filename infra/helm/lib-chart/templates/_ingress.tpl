{{- define "lib-chart.ingress" -}}
{{- if and .Values.ingress .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "lib-chart.fullname" . }}
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
{{ toYaml . | indent 4 }}
  {{- end }}
spec:
  ingressClassName: {{ .Values.ingress.className | default "nginx" }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host }}
      http:
        paths:
          - path: {{ .path | default "/" }}
            pathType: Prefix
            backend:
              service:
                name: {{ include "lib-chart.fullname" $ }}
                port: { number: {{ $.Values.service.port | default 8080 }} }
    {{- end }}
{{- end }}
{{- end -}}
