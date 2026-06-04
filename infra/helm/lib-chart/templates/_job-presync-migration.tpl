{{- define "lib-chart.presyncMigration" -}}
{{- if and .Values.migrations .Values.migrations.enabled }}
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "lib-chart.fullname" . }}-migrate
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: {{ .Values.migrations.hookDeletePolicy | default "BeforeHookCreation" }}
spec:
  backoffLimit: {{ .Values.migrations.backoffLimit | default 0 }}
  ttlSecondsAfterFinished: 600
  template:
    metadata:
      labels:
{{ include "lib-chart.selectorLabels" . | indent 8 }}
    spec:
      restartPolicy: Never
      serviceAccountName: {{ include "lib-chart.serviceAccountName" . }}
      securityContext:
{{ include "lib-chart.podSecurityContext" . | indent 8 }}
      containers:
        - name: migrate
          image: {{ include "lib-chart.imageRef" . | quote }}
          command:
{{ toYaml .Values.migrations.command | indent 12 }}
          securityContext:
{{ include "lib-chart.containerSecurityContext" . | indent 12 }}
          env:
{{ include "lib-chart.otelEnv" . | indent 12 }}
          {{- with .Values.migrations.envFromSecret }}
          envFrom:
            - secretRef:
                name: {{ . | quote }}
          {{- end }}
          resources:
{{ toYaml (.Values.migrations.resources | default (dict "requests" (dict "cpu" "50m" "memory" "64Mi") "limits" (dict "cpu" "500m" "memory" "256Mi"))) | indent 12 }}
{{- end }}
{{- end -}}
