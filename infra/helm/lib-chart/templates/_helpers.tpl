{{- define "lib-chart.fullname" -}}
{{- printf "%s-%s" .Release.Name "lib-chart" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "lib-chart.name" -}}
lib-chart
{{- end -}}

{{- define "lib-chart.labels" -}}
app.kubernetes.io/name: lib-chart
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Values.image.tag | default .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: argocd
helm.sh/chart: {{ printf "%s-%s" "lib-chart" .Chart.Version }}
{{- end -}}

{{- define "lib-chart.selectorLabels" -}}
app.kubernetes.io/name: lib-chart
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "lib-chart.imageRef" -}}
{{- if .Values.image.digest -}}
{{ .Values.image.repository }}@{{ .Values.image.digest }}
{{- else -}}
{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}
{{- end -}}
{{- end -}}

{{- define "lib-chart.serviceAccountName" -}}
{{- if and .Values.serviceAccount .Values.serviceAccount.create -}}
{{- default (include "lib-chart.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" (and .Values.serviceAccount .Values.serviceAccount.name) -}}
{{- end -}}
{{- end -}}
