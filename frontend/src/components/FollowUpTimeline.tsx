import type { FollowUpHistoryEntry } from '../types'

interface Props {
  entries: FollowUpHistoryEntry[]
}

export default function FollowUpTimeline({ entries }: Props) {
  if (!entries?.length) return null

  return (
    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--navy-06)' }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'var(--navy-60)',
          marginBottom: 12,
        }}
      >
        Follow-up timeline
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        {entries.map((entry, idx) => (
          <div
            key={`${entry.timestamp}-${idx}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '16px 1fr',
              gap: 10,
            }}
          >
            <div style={{ display: 'grid', justifyItems: 'center' }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'var(--teal)',
                  marginTop: 5,
                }}
              />
              {idx < entries.length - 1 && (
                <div
                  style={{
                    width: 2,
                    height: '100%',
                    background: 'var(--navy-12)',
                    marginTop: 4,
                  }}
                />
              )}
            </div>

            <div
              style={{
                border: '1px solid var(--navy-06)',
                borderRadius: 'var(--r-sm)',
                background: '#f8fafc',
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginBottom: 6,
                }}
              >
                <strong style={{ fontSize: 12, color: 'var(--navy)' }}>{entry.severity.toUpperCase()}</strong>
                <span style={{ fontSize: 12, color: 'var(--navy-60)' }}>
                  {new Date(entry.timestamp).toLocaleString('en-KE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--navy)', lineHeight: 1.5 }}>
                {entry.symptoms_added || 'Assessment checkpoint recorded.'}
              </p>
              {entry.reasoning && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--navy-60)', lineHeight: 1.5 }}>
                  {entry.reasoning}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
