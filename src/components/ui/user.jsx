import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

export function User({ email, name, className }) {
  const initials = name 
    ? name.split(' ').map(n => n[0]).join('')
    : email 
      ? email.charAt(0).toUpperCase()
      : '?';
      
  return (
    <Avatar className={className}>
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}