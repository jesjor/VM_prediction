import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }
  componentDidCatch(error, info) {
    this.setState({ error, info })
    console.error('React crash:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#0a0e1a', color: '#f0f4ff', minHeight: '100vh' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ App fejl — send dette til admin</h2>
          <pre style={{ background: '#111827', padding: '1rem', borderRadius: 8, overflow: 'auto', fontSize: 13, color: '#f97316', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.info?.componentStack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
