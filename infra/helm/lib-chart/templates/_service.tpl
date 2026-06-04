{{- define "lib-chart.service" -}}
{{- if .Values.service.enabled | default true }}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "lib-chart.fullname" . }}
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
spec:
  type: ClusterIP
  ports:
    - name: {{ .Values.service.name | default "http" }}
      port: {{ .Values.service.port | default 8080 }}
      targetPort: {{ .Values.service.name | default "http" }}
    - name: metrics
      port: {{ ((.Values.observability).metrics).port | default 9090 }}
      targetPort: metrics
  selector:
{{ include "lib-chart.selectorLabels" . | indent 4 }}
{{- end }}
{{- end -}}
