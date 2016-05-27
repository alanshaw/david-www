import React from 'react'

export default ({ info }) => (
  <div className='dep-table'>
    <table>
      <thead>
        <tr>
          <th>Dependency</th>
          <th><span className='visuallyhidden'>Changes</span></th>
          <th>Required</th>
          <th>Stable</th>
          <th>Latest</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {info.deps.map(dep => {
          return (
            <tr>
              <td className='dep'>
                <a href={`https://www.npmjs.com/package/${dep.name}`}>{dep.name}</a>
                <Advisories dep={dep} />
              </td>
              <td className='changes'>
                {dep.outOfDate && <a href='#' title='View closed issues and commits' className='changes-icon'><i className='fa fa-file-code-o'></i></a>}
              </td>
              <td className='required'>{dep.required}</td>
              <td className='stable'>{dep.stable}</td>
              <td className='latest'>{dep.latest}</td>
              <td className='status'>
                <span className={`sqr ${dep.status} ${dep.pinned ? 'pinned' : 'unpinned'}`} title={`${dep.pinned ? 'pinned ' : ''}${dep.status}`}></span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)

function Advisories ({ dep }) {
  if (!dep.advisories) return

  return (
    <ul className='vulns'>
      {dep.advisories.map((a) => (
        <li>
          <a href={`https://nodesecurity.io/advisories/${a.slug}`}>
            <i className='fa fa-exclamation-circle'></i>
            {a.title}
          </a>
        </li>
      ))}
    </ul>
  )
}
