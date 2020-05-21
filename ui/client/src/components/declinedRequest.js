import React from 'react'


class DeclinedRequest extends React.Component {
  state = {
    data: []
  }

  componentDidMount() {
    fetch('http://127.0.0.1:8000/api/declinedRequests')
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
        <h2>Declined Request</h2>
        <table class="rwd-table">
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>ORG1</th>
            <th>ORG2</th>
            <th>Request By</th>
          </tr>
          {this.state.data.map(arg => <DeclinedRequestObj Val = {arg.Val}/>)}
    </table>
    </div>
    )
  }
}


const DeclinedRequestObj = (props) => {
  return (
  <React.Fragment>
    <tr>
    <td data-th="Title">{props.Val.title}</td>
    <td data-th="Description">{props.Val.description}</td>
    <td data-th="ORG1">{props.Val.approvals.ORG1.status}</td>
    <td data-th="ORG2">{props.Val.approvals.ORG1.status}</td>
    <td data-th="Request By">{props.Val.from_user}</td>
    </tr>
  </React.Fragment>
  )
}

export default DeclinedRequest