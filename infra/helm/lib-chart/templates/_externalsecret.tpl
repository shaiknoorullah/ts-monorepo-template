{{- define "lib-chart.externalSecret" -}}
{{- if and .Values.externalSecret .Values.externalSecret.enabled }}
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {{ include "lib-chart.fullname" . }}-env
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
spec:
  refreshInterval: {{ .Values.externalSecret.refreshInterval | default "1h" }}
  secretStoreRef:
    name: {{ .Values.externalSecret.store.name }}
    kind: {{ .Values.externalSecret.store.kind | default "ClusterSecretStore" }}
  target:
    name: {{ include "lib-chart.fullname" . }}-env
    creationPolicy: Owner
  data:
    {{- range .Values.externalSecret.data }}
    - secretKey: {{ .secretKey | quote }}
      remoteRef:
{{ toYaml .remoteRef | indent 8 }}
    {{- end }}
{{- end }}
{{- end -}}
