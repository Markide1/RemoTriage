type Severity = 'normal' | 'moderate' | 'critical'
const C: Record<Severity,{label:string;bg:string;color:string;dot:string}> = {
  normal:   { label:'Normal',   bg:'#dcfce7', color:'#15803d', dot:'#16a34a' },
  moderate: { label:'Moderate', bg:'#fef9c3', color:'#a16207', dot:'#ca8a04' },
  critical: { label:'Critical', bg:'#fee2e2', color:'#b91c1c', dot:'#ef4444' },
}
export default function SeverityBadge({ severity }: { severity: Severity }) {
  const c = C[severity]
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:7,
      padding:'5px 13px', borderRadius:20, fontSize:12, fontWeight:700,
      letterSpacing:0.5, background:c.bg, color:c.color, textTransform:'uppercase' }}>
      <span style={{ width:7, height:7, borderRadius:'50%',
        background:c.dot, flexShrink:0, animation: severity === 'critical' ? 'pulse 1.5s ease-in-out infinite' : 'none' }} />
      {c.label}
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.7)}}`}</style>
    </span>
  )
}