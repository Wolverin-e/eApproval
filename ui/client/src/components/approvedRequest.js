import React from 'react'


class ApprovedRequest extends React.Component {
  state = {
    data: []
  }

  componentDidMount() {
    fetch('http://127.0.0.1:8000/api/approvedRequests')
    .then(res => res.json())
    .then( (res) => {
      res = res.response
      var a = JSON.parse(res)
      a = a.map(arg =>{
        let temp = JSON.parse(arg.Val)
        return {Key: arg.Key, Val: temp}
      } )
      console.log(a)
      return a
    }
    )
    .then((a) => {
      this.setState({data: a})
    })
    .catch(console.log)
  }

  render() {
    return (
      <div>
        <h2>Approved Request</h2>
        <table className="rwd-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>ORG1</th>
              <th>ORG2</th>
              <th>Request By</th>
            </tr>
          </thead>
          <tbody>
            {this.state.data.map((arg, i) => <ApprovedRequestObj key={i} Val={arg.Val}/>)}
          </tbody>
    </table>
    </div>
    )
  }
}


const ApprovedRequestObj = (props) => {
  return (
  <React.Fragment>
    <tr>
    <td data-th="Title">{props.Val.title}</td>
    <td data-th="Description">{props.Val.description}</td>
    <td data-th="ORG1">
      {props.Val.approvals.ORG1?props.Val.approvals.ORG1.status:'-----'}
    </td>
    <td data-th="ORG2">
      {props.Val.approvals.ORG2?props.Val.approvals.ORG2.status:'-----'}
    </td>
    <td data-th="Request By">{props.Val.from_user}</td>
    </tr>
  </React.Fragment>
  )
}

export default ApprovedRequest