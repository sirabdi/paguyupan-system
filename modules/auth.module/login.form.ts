import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginDTO } from "./dto";

export function useLoginForm() {
  return useForm<LoginDTO>({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
    resolver: zodResolver(LoginSchema),
  });
}
