import express from 'express'
import { v4 } from 'uuid'
import WebSocket from 'ws'
import bodyParser from 'body-parser'
import axios from 'axios'

const socker_url = process.env.SOCKET_URL
const app = express()
const port = process.env.APP_PORT

const bhclient = (() => {
  const url = process.env.BH_LOGIN_URL
  const login = process.env.BH_USERNAME
  const password = process.env.BH_PASSWORD

  let sessionId = ''

  const updateCredentials = async () => {
    console.info('[INFO]: renew sessionId')
    const { data } = await axios.post(url, {
      login,
      password,
    })

    sessionId = data.sessionId
  }

  return {
    get sessionId() {
      return sessionId
    },
    updateCredentials,
  }
})()

bhclient.updateCredentials()
app.listen(port)
app.use(bodyParser.json())

app.post('/', (req, res) => {
  let retry = false
  const { newChatId } = req.body

  if (!newChatId) {
    res.status(500).send('erorr')
  }

  const startSocket = () => {
    let closed = false

    const socket = new WebSocket(socker_url)
    const events = {
      handshake: v4().slice(0, 13),
      data: v4().slice(0, 13),
    }

    socket.onerror = async () => {
      await bhclient.updateCredentials()
      socket.close()

      console.log('error')
      if (retry) {
        return
      }

      startSocket()
      retry = true
    }

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          method: 'authHandshake',
          data: { sessionId: bhclient.sessionId },
          uid: events.handshake,
        })
      )
    }

    socket.addEventListener('message', (_event) => {
      const { event, data } = JSON.parse(_event.data)
      if (event === events.handshake) {
        socket.send(JSON.stringify({ method: 'evChangeChat', data: { newChatId }, uid: events.data }))
        return
      }

      if (event === 'pushUpdateDataChats') {
        res.send(data[0].adapterChatId)
        socket.close()
        closed = true
      }
    })

    setTimeout(() => {
      if (closed) {
        return
      }

      socket.close()
      res.status(408).send('timeout')
    }, 3000)
  }

  startSocket()
})
