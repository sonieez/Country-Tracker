import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { api } from "../lib/api"
import { useAuth } from "./AuthContext"

type CountryStatus = "visited" | "wishlist"
type StampMap = Record<string, CountryStatus>

type StampContextValue = {
  stamps: StampMap
  cycleStamp: (code: string) => Promise<void>
}

const StampsContext = createContext<StampContextValue>({stamps: {}, cycleStamp: async () => {}})

function nextStatus(currentStatus: CountryStatus | undefined): CountryStatus | "none" {
  switch (currentStatus) {
    case undefined:
      return "visited"
    case "visited":
      return "wishlist"
    case "wishlist":
      return "none"
  }
}

export function StampsProvider({ children }: {children: ReactNode}) {
  const [allStamps, setAllStamps] = useState<StampMap>({});
  const { user, openSignIn } = useAuth();

  useEffect(() => {
    let oldRequest = false;

    if (!user) {
      setAllStamps({});
      return;
    }
    async function loadStamps() {
      try{
        const loadedStamps = await api('/me/stamps');
        const convertedStamps: StampMap = {};

        for (const code of loadedStamps.visited) {
          convertedStamps[code] = "visited";
        }
        for (const code of loadedStamps.wishlist) {
          convertedStamps[code] = "wishlist";
        }
        if (oldRequest) return;

        setAllStamps(convertedStamps);        
      } catch(err) {
        console.error(err);
      }
    }

    loadStamps();

    return () => {oldRequest = true;}
  }, [user?.id])

  async function cycleStamp(code: string) {
    if (!user) {
      openSignIn();
      return;
    }
    const currentStatus = allStamps[code];
    const newStatus = nextStatus(currentStatus);
    const newStamps = {...allStamps}

    if (newStatus === "none") {
      delete newStamps[code];
    } else {
      newStamps[code] = newStatus;
    }
    const oldStamps = allStamps;
    setAllStamps(newStamps);

    try{
      await api(`/countries/${code}/stamp`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({status: newStatus})
      });
    } catch(err) {
      console.error(err);
      setAllStamps(oldStamps);
    }
  }

  return(
    <StampsContext.Provider value={{stamps: allStamps, cycleStamp: cycleStamp}}>
      {children}
    </StampsContext.Provider>
  )
}

export function useStamps() {
  return useContext(StampsContext)
}