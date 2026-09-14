# Architecture

The typed model owns selection and layout. The core owns DOM, dialog and controller lifecycle. GSAP motion and scroll presentation enhance the static gallery. The React adapter owns an isolated inner DOM tree and disposes the controller at unmount. The consumer owns images and data preprocessing. See API.md for controller contracts and CASE_STUDY.md for design decisions.
