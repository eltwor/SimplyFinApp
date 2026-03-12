--
-- PostgreSQL database dump
--

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-01-31 18:14:38

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA IF NOT EXISTS public;


-- ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

-- COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 16546)
-- Name: account_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_members (
    id integer NOT NULL,
    user_id integer NOT NULL,
    nickname character varying(100) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


-- ALTER TABLE public.account_members OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16545)
-- Name: account_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.account_members_id_seq OWNER TO postgres;

--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 223
-- Name: account_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_members_id_seq OWNED BY public.account_members.id;


--
-- TOC entry 226 (class 1259 OID 16577)
-- Name: account_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_types (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(100) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


-- ALTER TABLE public.account_types OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16576)
-- Name: account_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.account_types_id_seq OWNER TO postgres;

--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 225
-- Name: account_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_types_id_seq OWNED BY public.account_types.id;


--
-- TOC entry 228 (class 1259 OID 16596)
-- Name: category_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.category_limits (
    id integer NOT NULL,
    user_id integer NOT NULL,
    category character varying(100) NOT NULL,
    limit_amount numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


-- ALTER TABLE public.category_limits OWNER TO postgres;

--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE category_limits; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.category_limits IS 'User-specific spending limits for expense categories';


--
-- TOC entry 227 (class 1259 OID 16595)
-- Name: category_limits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.category_limits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.category_limits_id_seq OWNER TO postgres;

--
-- TOC entry 5142 (class 0 OID 0)
-- Dependencies: 227
-- Name: category_limits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.category_limits_id_seq OWNED BY public.category_limits.id;


--
-- TOC entry 230 (class 1259 OID 16617)
-- Name: payment_suggestions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_suggestions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    original_payment_id integer NOT NULL,
    suggested_date date NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_suggestions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'dismissed'::character varying])::text[])))
);


-- ALTER TABLE public.payment_suggestions OWNER TO postgres;

--
-- TOC entry 5143 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE payment_suggestions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.payment_suggestions IS 'Stores suggestions for recurring payment reminders';


--
-- TOC entry 5144 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN payment_suggestions.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_suggestions.status IS 'pending = waiting for user action, accepted = user created payment, dismissed = user ignored';


--
-- TOC entry 229 (class 1259 OID 16616)
-- Name: payment_suggestions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_suggestions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.payment_suggestions_id_seq OWNER TO postgres;

--
-- TOC entry 5145 (class 0 OID 0)
-- Dependencies: 229
-- Name: payment_suggestions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_suggestions_id_seq OWNED BY public.payment_suggestions.id;


--
-- TOC entry 222 (class 1259 OID 16495)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_type character varying(20) NOT NULL,
    payment_date date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    account_member_id integer,
    is_recurring boolean DEFAULT false NOT NULL,
    recurring_frequency character varying(50),
    account_type character varying(50) DEFAULT 'default'::character varying,
    CONSTRAINT check_amount_sign CHECK (((((payment_type)::text = 'expense'::text) AND (amount < (0)::numeric)) OR (((payment_type)::text = 'income'::text) AND (amount > (0)::numeric)))),
    CONSTRAINT payments_payment_type_check CHECK (((payment_type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying])::text[])))
);


-- ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16494)
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- TOC entry 5146 (class 0 OID 0)
-- Dependencies: 221
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- TOC entry 232 (class 1259 OID 24711)
-- Name: savings_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.savings_accounts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(200) NOT NULL,
    bank_name character varying(200) NOT NULL,
    account_type character varying(100) NOT NULL,
    interest_rate numeric(5,2) DEFAULT 0.00 NOT NULL,
    start_date date NOT NULL,
    maturity_date date,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


-- ALTER TABLE public.savings_accounts OWNER TO postgres;

--
-- TOC entry 5147 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE savings_accounts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.savings_accounts IS 'User-created templates for savings accounts with interest rates';


--
-- TOC entry 231 (class 1259 OID 24710)
-- Name: savings_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.savings_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.savings_accounts_id_seq OWNER TO postgres;

--
-- TOC entry 5148 (class 0 OID 0)
-- Dependencies: 231
-- Name: savings_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.savings_accounts_id_seq OWNED BY public.savings_accounts.id;


--
-- TOC entry 236 (class 1259 OID 24768)
-- Name: savings_deposits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.savings_deposits (
    id integer NOT NULL,
    savings_goal_id integer NOT NULL,
    account_member_id integer,
    amount numeric(10,2) NOT NULL,
    transaction_type character varying(20) NOT NULL,
    transaction_date date NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT savings_deposits_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['deposit'::character varying, 'withdrawal'::character varying])::text[])))
);


-- ALTER TABLE public.savings_deposits OWNER TO postgres;

--
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE savings_deposits; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.savings_deposits IS 'Individual deposit/withdrawal transactions for savings goals';


--
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN savings_deposits.amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.savings_deposits.amount IS 'Positive for deposits, negative for withdrawals';


--
-- TOC entry 235 (class 1259 OID 24767)
-- Name: savings_deposits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.savings_deposits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.savings_deposits_id_seq OWNER TO postgres;

--
-- TOC entry 5151 (class 0 OID 0)
-- Dependencies: 235
-- Name: savings_deposits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.savings_deposits_id_seq OWNED BY public.savings_deposits.id;


--
-- TOC entry 234 (class 1259 OID 24736)
-- Name: savings_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.savings_goals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    account_member_id integer,
    savings_account_id integer,
    name character varying(200) NOT NULL,
    target_amount numeric(10,2) NOT NULL,
    deadline date,
    notes text,
    is_completed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


-- ALTER TABLE public.savings_goals OWNER TO postgres;

--
-- TOC entry 5152 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE savings_goals; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.savings_goals IS 'Savings goals that users set to track their progress';


--
-- TOC entry 5153 (class 0 OID 0)
-- Dependencies: 234
-- Name: COLUMN savings_goals.target_amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.savings_goals.target_amount IS 'The goal amount the user wants to save';


--
-- TOC entry 233 (class 1259 OID 24735)
-- Name: savings_goals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.savings_goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.savings_goals_id_seq OWNER TO postgres;

--
-- TOC entry 5154 (class 0 OID 0)
-- Dependencies: 233
-- Name: savings_goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.savings_goals_id_seq OWNED BY public.savings_goals.id;


--
-- TOC entry 220 (class 1259 OID 16478)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    nickname character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16477)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4902 (class 2604 OID 16549)
-- Name: account_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_members ALTER COLUMN id SET DEFAULT nextval('public.account_members_id_seq'::regclass);


--
-- TOC entry 4905 (class 2604 OID 16580)
-- Name: account_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_types ALTER COLUMN id SET DEFAULT nextval('public.account_types_id_seq'::regclass);


--
-- TOC entry 4908 (class 2604 OID 16599)
-- Name: category_limits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_limits ALTER COLUMN id SET DEFAULT nextval('public.category_limits_id_seq'::regclass);


--
-- TOC entry 4911 (class 2604 OID 16620)
-- Name: payment_suggestions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_suggestions ALTER COLUMN id SET DEFAULT nextval('public.payment_suggestions_id_seq'::regclass);


--
-- TOC entry 4898 (class 2604 OID 16498)
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- TOC entry 4915 (class 2604 OID 24714)
-- Name: savings_accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_accounts ALTER COLUMN id SET DEFAULT nextval('public.savings_accounts_id_seq'::regclass);


--
-- TOC entry 4923 (class 2604 OID 24771)
-- Name: savings_deposits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_deposits ALTER COLUMN id SET DEFAULT nextval('public.savings_deposits_id_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 24739)
-- Name: savings_goals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_goals ALTER COLUMN id SET DEFAULT nextval('public.savings_goals_id_seq'::regclass);


--
-- TOC entry 4896 (class 2604 OID 16481)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4942 (class 2606 OID 16557)
-- Name: account_members account_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_members
    ADD CONSTRAINT account_members_pkey PRIMARY KEY (id);


--
-- TOC entry 4946 (class 2606 OID 16588)
-- Name: account_types account_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_types
    ADD CONSTRAINT account_types_pkey PRIMARY KEY (id);


--
-- TOC entry 4949 (class 2606 OID 16607)
-- Name: category_limits category_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_limits
    ADD CONSTRAINT category_limits_pkey PRIMARY KEY (id);


--
-- TOC entry 4951 (class 2606 OID 16609)
-- Name: category_limits category_limits_unique_user_category; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_limits
    ADD CONSTRAINT category_limits_unique_user_category UNIQUE (user_id, category);


--
-- TOC entry 4957 (class 2606 OID 16631)
-- Name: payment_suggestions payment_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_suggestions
    ADD CONSTRAINT payment_suggestions_pkey PRIMARY KEY (id);


--
-- TOC entry 4940 (class 2606 OID 16509)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 4961 (class 2606 OID 24729)
-- Name: savings_accounts savings_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_accounts
    ADD CONSTRAINT savings_accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 4972 (class 2606 OID 24782)
-- Name: savings_deposits savings_deposits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_deposits
    ADD CONSTRAINT savings_deposits_pkey PRIMARY KEY (id);


--
-- TOC entry 4967 (class 2606 OID 24751)
-- Name: savings_goals savings_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_goals
    ADD CONSTRAINT savings_goals_pkey PRIMARY KEY (id);


--
-- TOC entry 4931 (class 2606 OID 16492)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4933 (class 2606 OID 16490)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4943 (class 1259 OID 16564)
-- Name: idx_account_members_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_members_active ON public.account_members USING btree (user_id, is_active);


--
-- TOC entry 4944 (class 1259 OID 16563)
-- Name: idx_account_members_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_members_user_id ON public.account_members USING btree (user_id);


--
-- TOC entry 4947 (class 1259 OID 16594)
-- Name: idx_account_types_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_types_user_id ON public.account_types USING btree (user_id);


--
-- TOC entry 4952 (class 1259 OID 16615)
-- Name: idx_category_limits_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_category_limits_user_id ON public.category_limits USING btree (user_id);


--
-- TOC entry 4953 (class 1259 OID 16644)
-- Name: idx_payment_suggestions_original_payment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_suggestions_original_payment_id ON public.payment_suggestions USING btree (original_payment_id);


--
-- TOC entry 4954 (class 1259 OID 16643)
-- Name: idx_payment_suggestions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_suggestions_status ON public.payment_suggestions USING btree (status);


--
-- TOC entry 4955 (class 1259 OID 16642)
-- Name: idx_payment_suggestions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_suggestions_user_id ON public.payment_suggestions USING btree (user_id);


--
-- TOC entry 4934 (class 1259 OID 16570)
-- Name: idx_payments_account_member; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_account_member ON public.payments USING btree (account_member_id);


--
-- TOC entry 4935 (class 1259 OID 16516)
-- Name: idx_payments_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_date ON public.payments USING btree (payment_date);


--
-- TOC entry 4936 (class 1259 OID 16574)
-- Name: idx_payments_is_recurring; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_is_recurring ON public.payments USING btree (is_recurring);


--
-- TOC entry 4937 (class 1259 OID 16517)
-- Name: idx_payments_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_type ON public.payments USING btree (payment_type);


--
-- TOC entry 4938 (class 1259 OID 16515)
-- Name: idx_payments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_user_id ON public.payments USING btree (user_id);


--
-- TOC entry 4958 (class 1259 OID 24794)
-- Name: idx_savings_accounts_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_savings_accounts_active ON public.savings_accounts USING btree (user_id, is_active);


--
-- TOC entry 4959 (class 1259 OID 24793)
-- Name: idx_savings_accounts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_savings_accounts_user_id ON public.savings_accounts USING btree (user_id);


--
-- TOC entry 4968 (class 1259 OID 24800)
-- Name: idx_savings_deposits_account_member; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_savings_deposits_account_member ON public.savings_deposits USING btree (account_member_id);


--
-- TOC entry 4969 (class 1259 OID 24801)
-- Name: idx_savings_deposits_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_savings_deposits_date ON public.savings_deposits USING btree (transaction_date);


--
-- TOC entry 4970 (class 1259 OID 24799)
-- Name: idx_savings_deposits_goal_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_savings_deposits_goal_id ON public.savings_deposits USING btree (savings_goal_id);


--
-- TOC entry 4962 (class 1259 OID 24796)
-- Name: idx_savings_goals_account_member; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_savings_goals_account_member ON public.savings_goals USING btree (account_member_id);


--
-- TOC entry 4963 (class 1259 OID 24798)
-- Name: idx_savings_goals_completed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_savings_goals_completed ON public.savings_goals USING btree (is_completed);


--
-- TOC entry 4964 (class 1259 OID 24797)
-- Name: idx_savings_goals_savings_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_savings_goals_savings_account ON public.savings_goals USING btree (savings_account_id);


--
-- TOC entry 4965 (class 1259 OID 24795)
-- Name: idx_savings_goals_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_savings_goals_user_id ON public.savings_goals USING btree (user_id);


--
-- TOC entry 4929 (class 1259 OID 16493)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4975 (class 2606 OID 16558)
-- Name: account_members account_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_members
    ADD CONSTRAINT account_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4976 (class 2606 OID 16589)
-- Name: account_types account_types_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_types
    ADD CONSTRAINT account_types_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4977 (class 2606 OID 16610)
-- Name: category_limits category_limits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_limits
    ADD CONSTRAINT category_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4978 (class 2606 OID 16637)
-- Name: payment_suggestions payment_suggestions_original_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_suggestions
    ADD CONSTRAINT payment_suggestions_original_payment_id_fkey FOREIGN KEY (original_payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- TOC entry 4979 (class 2606 OID 16632)
-- Name: payment_suggestions payment_suggestions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_suggestions
    ADD CONSTRAINT payment_suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4973 (class 2606 OID 16565)
-- Name: payments payments_account_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_account_member_id_fkey FOREIGN KEY (account_member_id) REFERENCES public.account_members(id) ON DELETE SET NULL;


--
-- TOC entry 4974 (class 2606 OID 16510)
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4980 (class 2606 OID 24730)
-- Name: savings_accounts savings_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_accounts
    ADD CONSTRAINT savings_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4984 (class 2606 OID 24788)
-- Name: savings_deposits savings_deposits_account_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_deposits
    ADD CONSTRAINT savings_deposits_account_member_id_fkey FOREIGN KEY (account_member_id) REFERENCES public.account_members(id) ON DELETE SET NULL;


--
-- TOC entry 4985 (class 2606 OID 24783)
-- Name: savings_deposits savings_deposits_savings_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_deposits
    ADD CONSTRAINT savings_deposits_savings_goal_id_fkey FOREIGN KEY (savings_goal_id) REFERENCES public.savings_goals(id) ON DELETE CASCADE;


--
-- TOC entry 4981 (class 2606 OID 24757)
-- Name: savings_goals savings_goals_account_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_goals
    ADD CONSTRAINT savings_goals_account_member_id_fkey FOREIGN KEY (account_member_id) REFERENCES public.account_members(id) ON DELETE SET NULL;


--
-- TOC entry 4982 (class 2606 OID 24762)
-- Name: savings_goals savings_goals_savings_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_goals
    ADD CONSTRAINT savings_goals_savings_account_id_fkey FOREIGN KEY (savings_account_id) REFERENCES public.savings_accounts(id) ON DELETE SET NULL;


--
-- TOC entry 4983 (class 2606 OID 24752)
-- Name: savings_goals savings_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_goals
    ADD CONSTRAINT savings_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-01-31 18:14:38

--
-- PostgreSQL database dump complete
--

