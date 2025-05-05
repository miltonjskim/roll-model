"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { userAtom, isLoggedInAtom } from "@/features/auth/model/authAtoms";
import { axiosInstance } from "@/shared/lib/axios/axiosInstance";
import { showErrorToast } from "@/shared/lib/toast/toast";

const CallbackPage = () => {
  const router = useRouter();
  const setUser = useSetAtom(userAtom);
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get("/api/me", {
          withCredentials: true,
        });
        setUser(response.data);
        setIsLoggedIn(true);
        router.push("/");
      } catch (error) {
        setIsLoggedIn(false);
        showErrorToast("로그인 정보 확인에 실패했습니다.")
        router.push("/");
      }
    };

    fetchUser();
  }, [router, setUser, setIsLoggedIn]);

  return <div className="text-center py-10 text-xl">로그인 중입니다...</div>;
};

export default CallbackPage;
