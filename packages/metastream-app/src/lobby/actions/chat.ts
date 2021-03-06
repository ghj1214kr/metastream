import { actionCreator } from 'utils/redux'
import { RpcThunk } from 'lobby/types'
import { getUserName } from 'lobby/reducers/users.helpers'
import { rpc, RpcRealm } from 'network/middleware/rpc'
import { IMessage } from 'lobby/reducers/chat'
import { CHAT_MAX_MESSAGE_LENGTH } from 'constants/chat'

/** Message prior to being processed by reducer. */
type RawMessage = Pick<IMessage, Exclude<keyof IMessage, 'id'>>
export const addChat = actionCreator<RawMessage>('ADD_CHAT')

const broadcastChat = (text: string, userId: string | null): RpcThunk<void> => (
  dispatch,
  getState
) => {
  dispatch(
    addChat({
      author: userId
        ? {
            id: userId,
            username: getUserName(getState(), userId)
          }
        : undefined,
      content: text,
      timestamp: Date.now()
    })
  )
}
export const multi_broadcastChat = rpc('broadcastChat', RpcRealm.Multicast, broadcastChat)

const rpcAddChat = (text: string): RpcThunk<void> => (dispatch, getState, context) => {
  text = text.trim()
  if (text.length === 0) return

  if (text.length > CHAT_MAX_MESSAGE_LENGTH) {
    text = text.substr(0, CHAT_MAX_MESSAGE_LENGTH)
  }

  const userId = context.client.id.toString()
  dispatch(multi_broadcastChat(text, userId))
}
export const server_addChat = rpc('rpcAddChat', RpcRealm.Server, rpcAddChat)
