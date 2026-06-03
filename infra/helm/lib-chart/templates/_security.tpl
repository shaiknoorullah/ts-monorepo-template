{{- define "lib-chart.podSecurityContext" -}}
runAsNonRoot: true
runAsUser: {{ .Values.pod.securityContext.runAsUser | default 1000 }}
runAsGroup: {{ .Values.pod.securityContext.runAsGroup | default 1000 }}
fsGroup: {{ .Values.pod.securityContext.fsGroup | default 1000 }}
seccompProfile:
  type: RuntimeDefault
{{- end -}}

{{- define "lib-chart.containerSecurityContext" -}}
allowPrivilegeEscalation: false
privileged: false
readOnlyRootFilesystem: true
runAsNonRoot: true
runAsUser: {{ .Values.pod.securityContext.runAsUser | default 1000 }}
capabilities:
  drop: ["ALL"]
{{- end -}}
