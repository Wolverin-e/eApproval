import React from 'react'
import fetch from 'isomorphic-fetch'

class PendingRequest extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      request: {
        req_key: 'PENDING',
        department: this.props.department,
        remarks: '',
        pvtRemarks: {
          text:''
        },
      }
    }
    this.handleAccept = this.handleAccept.bind(this)
    this.handleDecline = this.handleDecline.bind(this)
    this.onChange = this.onChange.bind(this)
  }

  onChange(e) {
      if (e.target.id === 'Public_Remarks') {
          this.setState({ request: {...this.state.request, remarks: e.target.value.toString()} });
      } else if (e.target.id === 'Private_Request_text') {
          this.setState({ request: {...this.state.request, pvtRemarks: {...this.state.request.pvtRemarks,text:e.target.value.toString() }} });
      }
    }

  handleAccept(e) {

    let request = {...this.state.request, req_key:e}
    // console.log(request)
    fetch('http://127.0.0.1:8000/api/approve', {
        method: 'POST',
        body: JSON.stringify(request),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.status >= 200 && response.status < 300) {
            console.log(response);
            window.location.reload();
            return response;
          } else {
           console.log('Somthing happened wrong');
          }
    }).catch(err => err);
  }

  handleDecline(e) {
    let request = {...this.state.request, req_key:e}
    // console.log(request)
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
        <table className="rwd-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>ORG1</th>
              <th>ORG2</th>
              <th>Request By</th>
              <th>Public Remarks</th>
              <th>Private Remarks</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {this.state.data.map(arg => <PendingRequestObj Val={arg.Val} Key={arg.Key} onChange={this.onChange} handleAccept={this.handleAccept} handleDecline={this.handleDecline}/>)}
          </tbody>
    </table>
    </div>
    )
  }
}


const PendingRequestObj = (props) => {
  let req_key = props.Key.reduce( (prev, curr) => prev + " " + curr)
  // console.log(req_key)
  return (
  <React.Fragment>
    <tr>
    <td data-th="Title">{props.Val.title}</td>
    <td data-th="Description">{props.Val.description}</td>
    <td data-th="ORG1">{props.Val.approvals.ORG1.status}</td>
    <td data-th="ORG2">{props.Val.approvals.ORG1.status}</td>
    <td data-th="Request By">{props.Val.from_user}</td>
    <td data-th="Public Remarks"><input type="textfield" id="Public_Remarks" name="Public Remarks_text" onChange={props.onChange} /></td>
    <td data-th="Private Remarks"><input type="textfield" id="Private_Request_text" name="Private_Remarks_text" onChange={props.onChange} /></td>
    <td><button id="Approve" onClick={props.handleAccept(req_key)}>Approve</button><button id="Decline" onClick={props.handleDecline(req_key)}>Decline</button></td>
    </tr>
  </React.Fragment>
  )
}

export default PendingRequest