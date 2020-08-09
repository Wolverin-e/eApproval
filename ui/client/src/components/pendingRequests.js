import React from 'react'
import fetch from 'isomorphic-fetch'
import { saveAs } from 'file-saver'


class PendingRequest extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      request: {
        req_key: 'PENDING',
        department: this.props.department,
        remarks: {},
        pvtRemarks: {},
      },
    }
    this.handleAccept = this.handleAccept.bind(this)
    this.handleDecline = this.handleDecline.bind(this)
    this.onChange = this.onChange.bind(this)
    this.getReport = this.getReport.bind(this)

  }

  async onChange(e) {

    var file= {name:'',data:''}
    var reader = new FileReader()

    if (e.target.id === 'Public_Remarks') {
      // console.log("PublicRemarks")
      this.setState({ 
        request: {
          ...this.state.request, 
          remarks: {
            ...this.state.request.remarks,
            text:e.target.value.toString(),
          }
        }
      });
    }else if (e.target.id === 'Public_Request_file') {
      // console.log("PublicRemarksFile")
      file.name = e.target.files[0].name
      reader.onload = (evt) => {file.data = evt.target.result}
      reader.readAsDataURL(e.target.files[0]);

      this.setState({
        request: {
          ...this.state.request, 
          remarks: {
            ...this.state.request.remarks,
            file:file, 
          }
        }
      })
    }else if (e.target.id === 'Private_Remarks_text') {
      // console.log("PvtRemarks")
      this.setState({
        request: {
          ...this.state.request, 
          pvtRemarks: {
            ...this.state.request.pvtRemarks,
            text:e.target.value.toString(), 
          }
        } 
      });
    }else if (e.target.id === 'Private_Remarks_file') {
      // console.log("PvtRemarksFile")
      file.data = e.target.files[0].name
      reader.onload= (e) => {file.data=e.target.result}
      reader.readAsDataURL(e.target.files[0]);

        this.setState({
          request: {
            ...this.state.request,
            pvtRemarks: {
              ...this.state.request.pvtRemarks,
              file:file, 
            }
          }
        })
    }
    // console.log(this.state.request)
  }

  handleAccept(e) {
    let request = {...this.state.request, req_key:e.target.id}
    console.log(e.target.id, request)
    fetch('http://127.0.0.1:8000/api/approve', {
      method: 'POST',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response =>  {
      if (response.status >= 200 && response.status < 300) {
        // console.log(response.json());
        window.location.reload();
        return response;
      } else {
        console.log('Somthing happened wrong');
      }
    }).catch(err => err);
  }

  handleDecline(e) {
    let request = {...this.state.request, req_key:e.target.id}
    console.log(e.target.id, request)
    fetch('http://127.0.0.1:8000/api/decline', {
      method: 'POST',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => {
      if (response.status >= 200 && response.status < 300) {
        // console.log(response);
        window.location.reload();
        return response;
      } else {
        console.log('Somthing happened wrong');
      }
    }).catch(err => err);
  }

  getReport(data, name) {
        saveAs(data, name)
  }


  componentDidMount() {
    fetch('http://127.0.0.1:'+(this.props.department==="ORG1"?"8000":"8001")+'/api/pendingRequests')
    .then(res => res.json())
    .then( (res) => {
      // console.log(JSON.parse(res.response));
      return JSON.parse(res.response);
    })
    .then((a) => {
      this.setState({data: a})
    })
    .catch(console.log)
  }

  render() {
    return (
      <div>
        <h1>{this.props.department}'s Dashboard</h1>
        <table className="rwd-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Proposal</th>
              <th>Request By</th>
              {this.props.department==="ORG1"?null:
                <React.Fragment>
                  <th>ORG1</th>
                      <th>Remarks by ORG1</th>
                      <th>Report by ORG1</th>
                </React.Fragment>
              }

              {this.props.department==="ORG2"?null:
                <React.Fragment>
                  <th>ORG2</th>
                      <th>Remarks by ORG2</th>
                      <th>Report by ORG2</th>
                </React.Fragment>
              }
              
              <th>Public Remarks</th>
              <th>Public Report</th>
              <th>Private Remarks</th>
              <th>Private Report</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {this.state.data.map((arg, i) => {
              return arg.Val.requestedDepartments.includes(this.props.department)?
                <PendingRequestObj key={i} department={this.props.department} Val={arg.Val} Key={arg.Key} onChange={this.onChange} handleAccept={this.handleAccept} handleDecline={this.handleDecline} getReport={this.getReport} ref={{refPrivateReport:this.refPrivateReport, refPublicReport:this.refPublicReport}}/>:
                true;
            })}
          </tbody>
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
        <td data-th="Proposal"><button onClick={() => props.getReport(props.Val.user_proposal.data,props.Val.user_proposal.name)}>Download</button></td>
        <td data-th="Request By">{props.Val.from_user}</td>
        {props.department==="ORG1"?null:
          <React.Fragment>
          <td data-th="ORG1">
            {props.Val.approvals.ORG1?props.Val.approvals.ORG1.status:'------'}
          </td>
            {props.Val.approvals.ORG1.status!=='PENDING'? 
            <React.Fragment>
              <td data-th="Public remarks">{props.Val.remarks.ORG1.text}</td>
            <td data-th="Public report"><button onClick={() => props.getReport(props.Val.remarks.ORG1.file.data,props.Val.remarks.ORG1.file.name)}>Download</button></td>
            </React.Fragment>
            :<React.Fragment>
              <td>-----</td>
              <td>-----</td>
            </React.Fragment>

            }
          </React.Fragment>
        }
        {props.department==="ORG2"?null:
          <React.Fragment>
          <td data-th="ORG2">
            {props.Val.approvals.ORG2?props.Val.approvals.ORG2.status:'------'}
          </td>
          {props.Val.approvals.ORG2.status!=='PENDING'? 
          <React.Fragment>
            <td data-th="Public remarks">{props.Val.remarks.ORG2.text}</td>
            <td data-th="Public report"><button onClick={() => props.getReport(props.Val.remarks.ORG2.file.data,props.Val.remarks.ORG2.file.name)}>Download</button></td>
          </React.Fragment>
          :<React.Fragment>
          <td>-----</td>
          <td>-----</td>
          </React.Fragment>
            }
          </React.Fragment>
        }
        <td data-th="Public Remarks">
          {
            props.Val.approvals[props.department].status!=='PENDING'?
            props.Val.remarks[props.department].text:
              <input type="textfield" id="Public_Remarks" name="Public_Remarks_text" onChange={props.onChange} />
          }
        </td>
        <td data-th="Public Report">
          {
            props.Val.approvals[props.department].status!=='PENDING'?
              <td data-th="Public report"><button onClick={() => props.getReport(props.Val.remarks[props.department].file.data, props.Val.remarks[props.department].file.name)}>Download</button></td>:
              <input type="file" name="Public_Request_file" id="Public_Request_file" onChange={props.onChange}/>
            }
          </td>
        <td data-th="Private Remarks">
          {
            props.Val.approvals[props.department].status!=='PENDING'?
            props.Val.privateDataSet[props.department].text:
              <input type="textfield" id="Private_Remarks_text" name="Private_Remarks_text" onChange={props.onChange} />
          }
        </td>
        <td data-th="Private Report">
          {
            props.Val.approvals[props.department].status!=='PENDING'?
              <td data-th="Public report"><button onClick={() => props.getReport(props.Val.privateDataSet[props.department].file.data, props.Val.privateDataSet[props.department].file.name)}>Download</button></td>:
              <input type="file" name="Private_Remarks_file" id="Private_Remarks_file" onChange={props.onChange}/>

          }
        </td>
        <td>
          {props.Val.approvals[props.department].status!=='PENDING'?
            props.Val.approvals[props.department].status:
            <div>
              <button id={props.Key} onClick={props.handleAccept}>Approve</button>
              <button id={props.Key} onClick={props.handleDecline}>Decline</button>
            </div>
          }
        </td>
      </tr>
    </React.Fragment>
    )
}



export default PendingRequest