import { FlatList, useToast } from 'native-base'
import { useEffect, useState } from 'react'
import { api } from '../services/api'

import { Game, GameProps } from '../components/Game'
import { Loading } from '../components/Loading'
import { EmptyMyPoolList } from '../components/EmptyMyPoolList'

interface Props {
  poolId: string
  code: string
}

export function Guesses({ poolId, code }: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [games, setGames] = useState<GameProps[]>([])
  const [firstTeamPoints, setFirstTeamPoints] = useState('')
  const [secondTeamPoints, setSecondTeamPoints] = useState('')

  const toast = useToast()

  async function fetchGames() {
    try {
      setIsLoading(true)

      const response = await api.get(`/pools/${poolId}/games`)

      setGames(response.data.games)
    } catch (error) {
      console.log(error)

      toast.show({
        title: 'Não foi possível carregar os bolões',
        placement: 'top',
        bgColor: 'red.500'
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGuessConfirm(gameId: string) {
    try {
      if (!firstTeamPoints.trim() || !secondTeamPoints.trim()) {
        return toast.show({
          title: 'Informe o placar para enviar um palpite.',
          placement: 'top',
          bgColor: 'red.500'
        })
      }

      await api.post(`/pools/${poolId}/games/${gameId}/guesses`, {
        firstTeamPoints: Number(firstTeamPoints),
        secondTeamPoints: Number(secondTeamPoints)
      })

      toast.show({
        title: 'Palpite realizado com sucesso!',
        placement: 'top',
        bgColor: 'green.500'
      })

      fetchGames()
    } catch (error) {
      console.log(error)

      if (
        error.response?.data?.message ===
        'You already sent a guess to this game on this pool.'
      ) {
        return toast.show({
          title: 'Você já enviou um palpite para este jogo.',
          placement: 'top',
          bgColor: 'red.500'
        })
      }

      if (
        error.response?.data?.message ===
        'You cannot send guesses after the game is over.'
      ) {
        return toast.show({
          title:
            'Você não pode enviar um palpite depois que o jogo está terminado.',
          placement: 'top',
          bgColor: 'red.500'
        })
      }

      toast.show({
        title: 'Não foi possível enviar o palpite.',
        placement: 'top',
        bgColor: 'red.500'
      })
    }
  }

  useEffect(() => {
    fetchGames()
  }, [poolId])

  if (isLoading) {
    return <Loading />
  }

  return (
    <FlatList
      data={games}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <Game
          data={item}
          setFirstTeamPoints={setFirstTeamPoints}
          setSecondTeamPoints={setSecondTeamPoints}
          onGuessConfirm={() => handleGuessConfirm(item.id)}
        />
      )}
      _contentContainerStyle={{ pb: 10 }}
      ListEmptyComponent={() => <EmptyMyPoolList code={code} />}
    />
  )
}
