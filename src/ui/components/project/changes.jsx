import React from 'react'
import { connect } from 'react-redux'
import { requestChanges } from '../../actions'
import Loading from '../loading.jsx'

const Changes = React.createClass({
  propTypes: {
    dep: React.PropTypes.shape({
      name: React.PropTypes.string.isRequired,
      required: React.PropTypes.string.isRequired,
      stable: React.PropTypes.string,
      latest: React.PropTypes.string
    }).isRequired,
    changes: React.PropTypes.shape({
      closedIssues: React.PropTypes.array,
      commits: React.PropTypes.array
    }),
    config: React.PropTypes.shape({
      apiUrl: React.PropTypes.string.isRequired
    }).isRequired
  },

  componentDidMount () {
    const { name, required: from, stable: to } = this.props.dep
    this.props.requestChanges({ name, from, to })
  },

  render () {
    const changes = this.props.changes
    if (!changes) return <Loading className='loading changes-popup' />

    const { required: from, stable: to } = this.props.dep

    return (
      <div className='changes-popup'>
        <h1>Changelog <span>{from} to {to}</span></h1>
        <ClosedIssues issues={changes.closedIssues} />
        <Commits commits={changes.commits} />
      </div>
    )
  }
})

function Commits ({ commits }) {
  return (
    <div>
      <h2>Commits</h2>
      <ul>
        {commits.map((commit) => {
          if (commit.author.login) {
            return (
              <li>
                <a href={commit.author.html_url} title={commit.author.login} target='_blank'><img src={commit.author.avatar_url} alt={`Avatar for ${commit.author.login}`} /></a>
                <a href={commit.html_url} title={`Committed on ${commit.commit.committer.date}`} className='title' target='_blank'>{commit.commit.message}</a>
                <a href={commit.author.html_url} className='login' target='_blank'>{commit.author.login}</a> <time datetime={commit.commit.committer.date}>committed on {commit.commit.committer.date}</time>
              </li>
            )
          } else {
            return (
              <li>
                <img src='http://www.gravatar.com/avatar/?d=mm' alt={`Avatar for ${commit.commit.author.name}`} />
                <a href={commit.html_url} title={`Committed on ${commit.commit.committer.date}`} className='title' target='_blank'>{commit.commit.message}</a>
                {commit.commit.author.name} <time datetime={commit.commit.committer.date}>committed on {commit.commit.committer.date}</time>
              </li>
            )
          }
        })}
      </ul>
    </div>
  )
}

function ClosedIssues ({ issues }) {
  if (!issues || !issues.length) return null

  return (
    <div>
      <h2>Closed Issues</h2>
      <ul className='issues'>
        {issues.map((issue) => (
          <li>
            <a href={issue.user.html_url} title={issue.user.login} target='_blank'><img src={issue.user.avatar_url} alt={`Avatar for ${issue.user.login}`} /></a>
            <a href={issue.html_url} title={`Closed on ${issue.closed_at}`} className='title' target='_blank'><span>#{issue.number}</span> {issue.title}</a>
            <a href={issue.user.html_url} className='login' target='_blank'>{issue.user.login}</a>
            <time datetime={issue.closed_at}>closed on {issue.closed_at}</time>
          </li>
        ))}
      </ul>
    </div>
  )
}

const mapStateToProps = ({ config, changes }) => ({ config, changes })

const mapDispatchToProps = (dispatch) => {
  return { requestChanges: ({ name, from, to }) => dispatch(requestChanges({ name, from, to })) }
}

export default connect(mapStateToProps, mapDispatchToProps)(Changes)
