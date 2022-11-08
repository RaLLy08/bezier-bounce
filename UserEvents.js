class UserEvents {
        isMousePressed = false;
        isClicked = false;

        onMouseUnpress = () => {};
        onMouseClick = () => {};
        onMousePress = () => {};

        startPostion = {
            x: undefined,
            y: undefined
        }
        #mousePosition = {
            x: undefined,
            y: undefined,
            vy: undefined,
            vx: undefined,
        };

        syncPressedPostionFromStart = {
            x: undefined,
            y: undefined
        }
        syncPressedPosition = {
            x: undefined,
            y: undefined,
        };
        syncPressedVelocity = {
            x: undefined,
            y: undefined,
        };

        constructor(element) {
            element.onmousedown = (e) => {
                this.isMousePressed = true;
                this.startPostion.x = e.offsetX;
                this.startPostion.y = e.offsetY;
            };
            element.onmouseup  = () => {
                if (this.isMousePressed) {
                    this.isMousePressed = false;
                    this.isClicked = true;
                    this.#unpress();
                }
            };
            element.onmouseleave = () => {
                if (this.isMousePressed) {
                    this.#unpress();
                }
            };
            element.onmousemove = (e) => {
                this.#mousePosition.x = e.offsetX;
                this.#mousePosition.y = e.offsetY;
            }
        }

        sync = () => {
            this.syncPressedVelocity.x = this.#mousePosition.x - this.syncPressedPosition.x;
            this.syncPressedVelocity.y = this.#mousePosition.y -  this.syncPressedPosition.y;

            this.syncPressedPosition.x = this.#mousePosition.x;
            this.syncPressedPosition.y = this.#mousePosition.y;

            this.syncPressedPostionFromStart.x = this.syncPressedPosition.x - this.startPostion.x;
            this.syncPressedPostionFromStart.y = this.syncPressedPosition.y - this.startPostion.y;

            if (this.isClicked) {
                this.onMouseClick(this);
                this.isClicked = false;
            }

            if (this.isMousePressed) {
                this.onMousePress(this);
            }
        }

        #unpress = () => {
            this.isMousePressed = false;

            if (this.onMouseUnpress) {
                this.onMouseUnpress();
            }
        }

        getPressedSyncCords = () => {
            if (this.isMousePressed) return this.syncPressedPosition;
            return null;
        };
    }