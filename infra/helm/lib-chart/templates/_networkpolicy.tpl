{{- define "lib-chart.networkPolicy" -}}
{{- if and .Values.networkPolicy .Values.networkPolicy.enabled }}
{{- range $e := ((.Values.networkPolicy.egress).external | default list) -}}
{{- if eq $e.host "0.0.0.0/0" }}{{ fail "networkPolicy.egress.external must not contain 0.0.0.0/0" }}{{ end -}}
{{- end }}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "lib-chart.fullname" . }}-deny-all
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
spec:
  podSelector:
    matchLabels:
{{ include "lib-chart.selectorLabels" . | indent 6 }}
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "lib-chart.fullname" . }}-allow
  labels:
{{ include "lib-chart.labels" . | indent 4 }}
spec:
  podSelector:
    matchLabels:
{{ include "lib-chart.selectorLabels" . | indent 6 }}
  policyTypes: [Ingress, Egress]
  ingress:
    {{- if (.Values.networkPolicy.ingress).fromGateway }}
    - from:
        - namespaceSelector:
            matchLabels: { kubernetes.io/metadata.name: gateway-system }
    {{- end }}
    {{- range ((.Values.networkPolicy.ingress).fromNamespaces | default list) }}
    - from:
        - namespaceSelector:
            matchLabels: { kubernetes.io/metadata.name: {{ . | quote }} }
    {{- end }}
  egress:
    {{- if (.Values.networkPolicy.egress).dns }}
    - to:
        - namespaceSelector:
            matchLabels: { kubernetes.io/metadata.name: kube-system }
      ports:
        - { protocol: UDP, port: 53 }
        - { protocol: TCP, port: 53 }
    {{- end }}
    {{- range ((.Values.networkPolicy.egress).platformDeps | default list) }}
    - to:
        - namespaceSelector:
            matchLabels: { platform.dep: {{ . | quote }} }
    {{- end }}
    {{- range ((.Values.networkPolicy.egress).external | default list) }}
    # external host: {{ .host }}
    - to: []
      ports:
        - { protocol: TCP, port: {{ .port }} }
    {{- end }}
{{- end }}
{{- end -}}
