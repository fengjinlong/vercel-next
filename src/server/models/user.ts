export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<User>) {
    this.id = data.id || "";
    this.username = data.username || "";
    this.email = data.email || "";
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toJSON(): User {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
