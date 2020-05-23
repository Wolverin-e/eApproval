import React from 'react'
import fetch from 'isomorphic-fetch'

class PendingRequest extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      // request = {
      //   req_key: '',
      //   department: '',
      //   remarks: ''
      // }
    }
    this.handleAccept = this.handleAccept.bind(this)
    this.handleDecline = this.handleDecline.bind(this)
  }

  handleAccept() {
    let request = {
      req_key: 'PENDING',
      department: this.props.department,
      remarks: 'GOOD!'
      // Remarks to be added
    }
    fetch('http://127.0.0.1:8000/api/approve', {
        method: 'POST',
        body: JSON.stringify(request),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.status >= 200 && response.status < 300) {
            console.log(response);
            return response;
            // window.location.reload();
          } else {
           console.log('Somthing happened wrong');
          }
    }).catch(err => err);
  }

  handleDecline() {
    let request = {
      req_key: 'PENDING',
      department: this.props.department,
      remarks: 'HARMFUL!'
      // Remarks to be added
    }
    console.log(request)
    fetch('http://127.0.0.1:8000/api/decline', {
        method: 'POST',
        body: JSON.stringify(request),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.status >= 200 && response.status < 300) {
            console.log(response);
            return response;
            // window.location.reload();
          } else {
           console.log('Somthing happened wrong');
          }
    }).catch(err => err);
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
        <h1>{this.props.department}</h1>
        <h2>Pending Requests</h2>
        <table class="rwd-table">
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>ORG1</th>
            <th>ORG2</th>
            <th>Request By</th>
            <th>Action</th>
          </tr>
          {this.state.data.map(arg => <PendingRequestObj Val = {arg.Val} handleAccept={this.handleAccept} handleDecline={this.handleDecline}/>)}
    </table>
    </div>
    )
  }
}


const PendingRequestObj = (props) => {
  return (
  <React.Fragment>
    <tr>
    <td data-th="Title">{props.Val.title}</td>
    <td data-th="Description">{props.Val.description}</td>
    <td data-th="ORG1">{props.Val.approvals.ORG1.status}</td>
    <td data-th="ORG2">{props.Val.approvals.ORG1.status}</td>
    <td data-th="Request By">{props.Val.from_user}</td>
    <td><button onClick={props.handleAccept}>Approve</button><button onClick={props.handleDecline}>Decline</button></td>
    </tr>
  </React.Fragment>
  )
}

export default PendingRequest