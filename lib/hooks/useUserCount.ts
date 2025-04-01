"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export let useUserCount = () => {
  let [refreshKey, setRefreshKey] = useState(0);
  let [loading, setLoading] = useState(true);
  let [userCount, setUserCount] = useState(0); // set default to 1 for now
  let { status } = useSession();
  let handleChange = () => {
    setRefreshKey((oldKey) => oldKey + 1);
  };

  useEffect(() => {
    if (status === "authenticated") {
      let apiUrl = `/api/v1/requests/user-count`;
      fetch(apiUrl)
        .then((res) => res.json())
        .then((data) => {
          setUserCount(data.totalCount);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    }
  }, [refreshKey, status]);

  return { userCount, loading, handleChange };
};
