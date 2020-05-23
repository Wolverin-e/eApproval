import React from 'react'
import fetch from 'isomorphic-fetch'


class createRequest extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
        from_user: '',
        title: '',
        descriptions: '',
        requestedDepartments: "ORG1 ORG2"
      }
    this.onChange = this.onChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  onChange(e) {
    if (e.target.id === 'from_user') {
        this.setState({ title: e.target.value });
    } else if (e.target.id === 'title') {
        this.setState({ desc: e.target.value });
    } else if (e.target.id === 'Departments') {
        this.setState({ type: e.target.value });
    }
    console.log(e.target.value);
    }

    handleSubmit() {

        fetch('http://127.0.0.1:8000/api/createRequest', {
            method: 'POST',
            body: JSON.stringify(this.state),
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

  render() {

    return (
        <div>
        <form>
          <label htmlfor="from_user">Username:</label><br/>
          <input type="text" id="from_user" name="from_user" onChange={this.onChange} /><br/>
          <label htmlfor="title">title:</label><br/>
          <input type="text" id="title" name="title"  onChange={this.onChange} /><br/><br/>
          <label htmlfor="descriptions">description:</label><br/>
          <input type="textfield" id="descriptions" name="descriptions" onChange={this.onChange} /><br/><br/>
          <label htmlfor="descriptions">Departments::</label><br/>
          <input type="checkbox" id="ORG1" name="ORG1" value="ORG1" onChange={this.onChange} />
            <label htmlfor="ORG1"> ORG1</label><br/>
            <input type="checkbox" id="ORG2" name="ORG2" value="ORG2" onChange={this.onChange}/>
            <label htmlfor="ORG2"> ORG2</label><br/><br/>
          <input type="submit" onClick={this.handleSubmit}/>
        </form>
        </div>

    )
  }
}


export default createRequest


