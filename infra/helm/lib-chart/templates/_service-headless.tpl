{{- define "lib-chart.serviceHeadless" -}}
{{- if and .Values.service.headless .Values.service.headless.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "lib-chart.fullname" . }}-headless
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
spec:
  clusterIP: None
  ports:
    - name: {{ .Values.service.name | default "http" }}
      port: {{ .Values.service.port | default 8080 }}
  selector:
{{ include "lib-chart.selectorLabels" . | indent 4 }}
{{- end }}
{{- end -}}
