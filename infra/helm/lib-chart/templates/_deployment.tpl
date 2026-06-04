{{- define "lib-chart.workload" -}}
{{- if eq (.Values.workload.kind | default "Deployment") "Deployment" }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "lib-chart.fullname" . }}
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
spec:
  replicas: {{ .Values.workload.replicas | default 1 }}
  selector:
    matchLabels:
{{ include "lib-chart.selectorLabels" . | indent 6 }}
  template:
    metadata:
      labels:
{{ include "lib-chart.selectorLabels" . | indent 8 }}
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: {{ ((.Values.observability).metrics).port | default 9090 | quote }}
        prometheus.io/path: {{ ((.Values.observability).metrics).path | default "/metrics" | quote }}
    spec:
      serviceAccountName: {{ include "lib-chart.serviceAccountName" . }}
      automountServiceAccountToken: {{ default false (and .Values.serviceAccount .Values.serviceAccount.tokenMount) }}
      {{- with .Values.priorityClassName }}
      priorityClassName: {{ . }}
      {{- end }}
      securityContext:
{{ include "lib-chart.podSecurityContext" . | indent 8 }}
      containers:
        - name: app
          image: {{ include "lib-chart.imageRef" . | quote }}
          imagePullPolicy: {{ .Values.image.pullPolicy | default "IfNotPresent" }}
          ports:
            - name: {{ .Values.service.name | default "http" }}
              containerPort: {{ .Values.service.port | default 8080 }}
            - name: metrics
              containerPort: {{ ((.Values.observability).metrics).port | default 9090 }}
          securityContext:
{{ include "lib-chart.containerSecurityContext" . | indent 12 }}
          env:
{{ include "lib-chart.otelEnv" . | indent 12 }}
          {{- with .Values.envFrom }}
          envFrom:
{{ toYaml . | indent 12 }}
          {{- end }}
          resources:
{{ toYaml (.Values.resources | default dict) | indent 12 }}
          volumeMounts:
            - name: tmp
              mountPath: /tmp
            {{- with .Values.volumeMounts }}
{{ toYaml . | indent 12 }}
            {{- end }}
      {{- with .Values.sidecars }}
        {{- range . }}
          {{- if hasKey . "resources" | not }}{{ fail (printf "sidecar %s must declare resources" .name) }}{{ end }}
        {{- end }}
        {{- toYaml . | nindent 8 }}
      {{- end }}
      volumes:
        - name: tmp
          emptyDir: {}
        {{- with .Values.volumes }}
{{ toYaml . | indent 8 }}
        {{- end }}
{{- else if eq .Values.workload.kind "Rollout" }}
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: {{ include "lib-chart.fullname" . }}
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
spec:
  replicas: {{ .Values.workload.replicas | default 1 }}
  selector:
    matchLabels:
{{ include "lib-chart.selectorLabels" . | indent 6 }}
  strategy:
{{ toYaml .Values.workload.strategy | indent 4 }}
  template:
    metadata:
      labels:
{{ include "lib-chart.selectorLabels" . | indent 8 }}
    spec:
      serviceAccountName: {{ include "lib-chart.serviceAccountName" . }}
      {{- with .Values.priorityClassName }}
      priorityClassName: {{ . }}
      {{- end }}
      securityContext:
{{ include "lib-chart.podSecurityContext" . | indent 8 }}
      containers:
        - name: app
          image: {{ include "lib-chart.imageRef" . | quote }}
          ports:
            - name: {{ .Values.service.name | default "http" }}
              containerPort: {{ .Values.service.port | default 8080 }}
          securityContext:
{{ include "lib-chart.containerSecurityContext" . | indent 12 }}
          env:
{{ include "lib-chart.otelEnv" . | indent 12 }}
          resources:
{{ toYaml (.Values.resources | default dict) | indent 12 }}
{{- end }}
{{- end -}}
