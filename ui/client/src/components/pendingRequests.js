import React from 'react'


class PendingRequest extends React.Component {
  state = {
    data: []
  }

  componentDidMount() {
    fetch('http://127.0.0.1:8000/api/pendingRequests')
    .then(res => res.json())
    .then( (res) => {
      res = res.response
      var a = JSON.parse(res)
      a = a.map(arg =>{
        let temp = JSON.parse(arg.Val)
        return {Key: arg.Key, Val: temp}
      } )
      // console.log(a)
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
      <center><h1>Pending Requests</h1></center>
        <div className="card">
          <div className="card-body">
            {this.state.data.map(arg => console.log(arg))}
            {this.state.data.map(arg => <PendingRequestObj Val = {arg.Val}/>)}
          </div>
        </div>
    </div>
    )
  }
}

const PendingRequestObj = (props) => {
  return (<div>
    <div>
      <h2>Title: {props.Val.title}</h2>
    </div>
    <div>
      ORG1: {props.Val.approvals.ORG1.status}
    </div>
    <div>
      ORG2: {props.Val.approvals.ORG2.status}
    </div>
    <div>
      Description: {props.Val.description}
    </div>
    <div>
      User: {props.Val.from_user}
    </div>
  </div>
  )
}

export default PendingRequest