"use client";

import React, { useState } from "react";
import { Toaster, toast } from "@/components/ui/sonner";

type UserRole = "adm" | "financeiro" | "medico" | "cliente";

interface User {
  email: string;
  password: string;
  role: UserRole;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("cliente");
  const [isRegistering, setIsRegistering] = useState(false);
  const [users, setUsers] = useState<User[]>([]); // Usuários cadastrados localmente
  const [loggedUser, setLoggedUser] = useState<User | null>(null);

  const handleRegister = () => {
    if (!email || !password) {
      toast.error("Preencha todos os campos!");
      return;
    }

    if (users.find((u) => u.email === email)) {
      toast.error("Usuário já existe!");
      return;
    }

    const newUser: User = { email, password, role };
    setUsers([...users, newUser]);
    toast.success(`Usuário ${role.toUpperCase()} criado com sucesso!`);
    setEmail("");
    setPassword("");
  };

  const handleLogin = () => {
    const user = users.find(
      (u) => u.email === email && u.password === password
    );
    if (!user) {
      toast.error("Usuário ou senha incorretos!");
      return;
    }
    setLoggedUser(user);
    toast.success(`Bem-vindo, ${user.role.toUpperCase()}!`);
  };

  if (loggedUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <h1 className="text-3xl font-bold mb-4">Olá, {loggedUser.role.toUpperCase()}</h1>
        <p className="text-gray-700 mb-6">Você está logado como {loggedUser.email}</p>
        <button
          onClick={() => setLoggedUser(null)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isRegistering ? "Criar Usuário" : "Login"}
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 border rounded"
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 border rounded"
        />

        {isRegistering && (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full p-3 mb-4 border rounded"
          >
            <option value="adm">Administrador</option>
            <option value="financeiro">Financeiro</option>
            <option value="medico">Médico</option>
            <option value="cliente">Cliente</option>
          </select>
        )}

        <button
          onClick={isRegistering ? handleRegister : handleLogin}
          className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 mb-2"
        >
          {isRegistering ? "Criar Conta" : "Entrar"}
        </button>

        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full p-3 text-blue-600 hover:underline"
        >
          {isRegistering ? "Já tem conta? Faça login" : "Criar uma nova conta"}
        </button>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
