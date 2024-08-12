import React, { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import "./CardCarousel.css";

function CardCarousel() {
    const [cards, setCards] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState(null); // State to track the selected card
    const cardRefs = useRef([]);

    useEffect(() => {
        // Fetch data from the API
        const fetchData = async () => {
            try {
                const response = await fetch(process.env.REACT_APP_API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        subject: "Data Structures & Algorithms",
                    }),
                });
                const data = await response.json();
                setCards(data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (cards.length === 0) return; // Ensure there's data before initializing GSAP

        gsap.registerPlugin(ScrollTrigger);

        let iteration = 0;

        const spacing = 0.1;
        const snap = gsap.utils.snap(spacing);
        const cardElements = gsap.utils.toArray(".cards li");
        const seamlessLoop = buildSeamlessLoop(cardElements, spacing);
        const scrub = gsap.to(seamlessLoop, {
            totalTime: 0,
            duration: 0.5,
            ease: "power3",
            paused: true,
        });
        const trigger = ScrollTrigger.create({
            start: 0,
            end: "+=3000",
            pin: ".gallery",
            onUpdate(self) {
                if (
                    self.progress === 1 &&
                    self.direction > 0 &&
                    !self.wrapping
                ) {
                    wrapForward(self);
                } else if (
                    self.progress < 1e-5 &&
                    self.direction < 0 &&
                    !self.wrapping
                ) {
                    wrapBackward(self);
                } else {
                    scrub.vars.totalTime = snap(
                        (iteration + self.progress) * seamlessLoop.duration()
                    );
                    scrub.invalidate().restart();
                    self.wrapping = false;
                }
            },
        });

        function wrapForward(trigger) {
            iteration++;
            trigger.wrapping = true;
            trigger.scroll(trigger.start + 1);
        }

        function wrapBackward(trigger) {
            iteration--;
            if (iteration < 0) {
                iteration = 9;
                seamlessLoop.totalTime(
                    seamlessLoop.totalTime() + seamlessLoop.duration() * 10
                );
                scrub.pause();
            }
            trigger.wrapping = true;
            trigger.scroll(trigger.end - 1);
        }

        function scrubTo(totalTime) {
            let progress =
                (totalTime - seamlessLoop.duration() * iteration) /
                seamlessLoop.duration();
            if (progress > 1) {
                wrapForward(trigger);
            } else if (progress < 0) {
                wrapBackward(trigger);
            } else {
                trigger.scroll(
                    trigger.start + progress * (trigger.end - trigger.start)
                );
            }
        }

        function buildSeamlessLoop(items, spacing) {
            let overlap = Math.ceil(1 / spacing);
            let startTime = items.length * spacing + 0.5;
            let loopTime = (items.length + overlap) * spacing + 1;
            let rawSequence = gsap.timeline({ paused: true });
            let seamlessLoop = gsap.timeline({
                paused: true,
                repeat: -1,
                onRepeat() {
                    if (this._time === this._dur) {
                        this._tTime += this._dur - 0.01;
                    }
                },
            });
            let l = items.length + overlap * 2;
            let time = 0;
            let i;
            let index;
            let item;

            gsap.set(items, { xPercent: 400, opacity: 0, scale: 0 });

            for (i = 0; i < l; i++) {
                index = i % items.length;
                item = items[index];
                time = i * spacing;
                rawSequence
                    .fromTo(
                        item,
                        { scale: 0, opacity: 0 },
                        {
                            scale: 1,
                            opacity: 1,
                            zIndex: 100,
                            duration: 0.5,
                            yoyo: true,
                            repeat: 1,
                            ease: "power1.in",
                            immediateRender: false,
                        },
                        time
                    )
                    .fromTo(
                        item,
                        { xPercent: 400 },
                        {
                            xPercent: -400,
                            duration: 1,
                            ease: "none",
                            immediateRender: false,
                        },
                        time
                    );
                if (i <= items.length) {
                    seamlessLoop.add("label" + i, time);
                }
            }

            rawSequence.time(startTime);
            seamlessLoop
                .to(rawSequence, {
                    time: loopTime,
                    duration: loopTime - startTime,
                    ease: "none",
                })
                .fromTo(
                    rawSequence,
                    { time: overlap * spacing + 1 },
                    {
                        time: startTime,
                        duration: startTime - (overlap * spacing + 1),
                        immediateRender: false,
                        ease: "none",
                    }
                );
            return seamlessLoop;
        }

        return () => {
            // Cleanup GSAP animations and ScrollTrigger when the component unmounts
            ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
            gsap.killTweensOf(seamlessLoop);
        };
    }, [cards]); // Re-run the effect when cards are updated

    const handleCardClick = (cardId) => {
        if (selectedCardId === cardId) {
            setSelectedCardId(null);
            return;
        }
        setSelectedCardId(cardId);
    };

    return (
        <div className="gallery">
            <ul className="cards">
                {cards.map((card) => (
                    <li
                        key={card.id}
                        onClick={() => handleCardClick(card.id)}
                        ref={(el) => (cardRefs.current[card.id] = el)}
                    >
                        <h3>
                            {selectedCardId === card.id ? "Answer" : "Question"}
                        </h3>
                        <br></br>
                        {selectedCardId === card.id
                            ? card.answer
                            : card.question}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default CardCarousel;
