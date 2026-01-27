import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react"
import { getConfigFn } from "@/actions/config.action"
import { getUserCreditsFn } from "@/actions/credit.action"
import { getUserInfoFn } from "@/actions/user.action"
import type { PublicConfig } from "@/config/schema"
import type { UserCredits, UserInfo } from "@/shared/types/user"

type GlobalContextType = {
  config: PublicConfig | null
  userInfo: UserInfo | null
  credits: UserCredits | null
  isLoadingConfig: boolean
  isLoadingUserInfo: boolean
  isLoadingCredits: boolean
  refreshConfig: () => Promise<void>
  refreshUserInfo: () => Promise<void>
  refreshCredits: () => Promise<void>
  clearUserInfo: () => void
}

const GlobalContext = createContext<GlobalContextType | null>(null)

export const useGlobalContext = () => {
  const context = useContext(GlobalContext)
  if (!context) {
    throw new Error("useGlobalContext must be used within GlobalContextProvider")
  }
  return context
}

export const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()

  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["config"],
    queryFn: () => getConfigFn(),
    staleTime: 0,
    gcTime: 0,
  })

  const { data: userInfo, isLoading: isLoadingUserInfo } = useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfoFn(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: credits, isLoading: isLoadingCredits } = useQuery({
    queryKey: ["credits"],
    queryFn: () => getUserCreditsFn(),
    staleTime: 0,
    gcTime: 0,
  })

  const refreshConfig = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["config"] })
  }, [queryClient])

  const refreshUserInfo = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["userInfo"] })
  }, [queryClient])

  const refreshCredits = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["credits"] })
  }, [queryClient])

  const clearUserInfo = useCallback(() => {
    queryClient.setQueryData(["userInfo"], null)
  }, [queryClient])

  const value = useMemo(
    () => ({
      config: config ?? null,
      userInfo: userInfo ?? null,
      credits: credits ?? null,
      isLoadingConfig,
      isLoadingUserInfo,
      isLoadingCredits,
      refreshConfig,
      refreshUserInfo,
      refreshCredits,
      clearUserInfo,
    }),
    [
      config,
      userInfo,
      credits,
      isLoadingConfig,
      isLoadingUserInfo,
      isLoadingCredits,
      refreshConfig,
      refreshUserInfo,
      refreshCredits,
      clearUserInfo,
    ]
  )

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
}
