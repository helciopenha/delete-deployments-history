import'dotenv/config'
import axios from 'axios'

const baseURL = 'https://api.github.com/repos'

const credentials = {
  user: process.env.GH_USER,
  token: process.env.GH_TOKEN,
  company: process.env.GH_COMPANY,
  repository: process.env.GH_REPOSITORY
}

const buff = new Buffer.from(`${credentials.user}:${credentials.token}`)
const auth = `Basic ${buff.toString('base64')}`

let count = 0
let countInvalided = 0
let countDeleted = 0

async function processDelete() {
  const pathGet = `/${credentials.company}/${credentials.repository}/deployments`
  const responseDeployments = await getDeploymentHistory(pathGet)
  
  if (String(responseDeployments.status) !== '200')
   return

  const deployments = responseDeployments.data
  
  for(const deploy of deployments) {
    count++
    
    let pathPost = `/${credentials.company}/${credentials.repository}/deployments/${deploy.id}/statuses`
    let returnToInvalid = await postDeploymentToInvalid(pathPost, deploy.id)
    if(! returnToInvalid.error)
      countInvalided++

    let pathDelete = `/${credentials.company}/${credentials.repository}/deployments/${deploy.id}`
    let returnDeleted = await deleteDeployment(pathDelete, deploy.id)
    if(! returnDeleted.error)
      countDeleted++
  }

  console.log(
    `
    >> Total: ${count}
    >> Invalidados: ${countInvalided}
    >> Deletados: ${countDeleted}
    `
    )
}

async function getDeploymentHistory(pathGet) {
  return await sendRequest('GET', pathGet)
}

async function postDeploymentToInvalid(pathPost, deployId) {
  return await sendRequest(
    'POST',
    pathPost,
    { state: "inactive" },
    deployId
  )
}

async function deleteDeployment(pathDelete, deployId) {
  return await sendRequest(
    'DELETE',
    pathDelete,
    undefined,
    deployId
  )
}

async function sendRequest(method, path, data, deployId) {

  var options = {
    method,
    url: baseURL+path,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.ant-man-preview+json',
      Authorization: auth
    },
    data
  };
  
  return await axios.request(options).then(function (response) {
    console.log(`>> method: ${method}, >> status: ${response.status}, >> id: ${deployId}`)
    return {
      status: response.status,
      data: response.data
    }
  }).catch(function (error) {
    console.log(`>> method: ${method}, >> status: ${error.response.status}, ${deployId}`)
    console.log('>> data', error.response.data)
    return {
      error: true,
      status: error.response.status,
      data: error.response.data
    }
  })
}

// processDelete()