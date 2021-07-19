import { body } from "express-validator"

export const UserValidator = [
    body("firstname").exists().isString().withMessage("Firstname is a mandatory field"),
    body("surname").exists().isString().withMessage("Surname is a mandatory field"),
    body("screenname").exists().isString().withMessage("Screenname is a mandatory field"),
    body("email")
        .exists()
        .isEmail()
        .normalizeEmail()
        .isLength({ max: 64 })
        .withMessage("Email is a mandatory field")
        .isEmail()
        .normalizeEmail()
        .withMessage("Invalid email"),
    body("password").exists().isStrongPassword().withMessage("Password is a mandatory field and needs to be strong")
]

export const UserEditValidator = [
    body("firstname").isString().withMessage("Firstname needs to be of type string"),
    body("surname").isString().withMessage("Surname needs to be of type string"),
    body("screenname").isString().withMessage("Screenname needs to be of type string"),
    body("email").isLength({ max: 64 }).withMessage("Email is a mandatory field").isEmail().normalizeEmail().withMessage("Invalid email")
]

export const LoginValidator = [
    body("email").exists().withMessage("Email is a mandatory field").isEmail().normalizeEmail().withMessage("Invalid email"),
    body("password").exists().withMessage("Password is a mandatory field")
]
//demo
