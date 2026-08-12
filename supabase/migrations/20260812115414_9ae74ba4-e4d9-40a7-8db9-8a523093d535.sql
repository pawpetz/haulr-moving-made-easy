
-- ROLES
CREATE TYPE public.app_role AS ENUM ('customer','mover','admin');
CREATE TYPE public.mover_status AS ENUM ('PENDING','UNDER_REVIEW','APPROVED','REJECTED','SUSPENDED');
CREATE TYPE public.job_status AS ENUM ('REQUESTED','SEARCHING','MOVER_ASSIGNED','MOVER_EN_ROUTE','MOVER_ARRIVED','LOADING','IN_TRANSIT','ARRIVED','UNLOADING','COMPLETED','CANCELLED','DISPUTED');
CREATE TYPE public.vehicle_type AS ENUM ('PICKUP_TRUCK','CARGO_VAN','BOX_TRUCK');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND role <> 'admin');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  address text,
  avatar_url text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- MOVER PROFILES
CREATE TABLE public.mover_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  email text,
  address text,
  license_number text,
  license_state text,
  insurance_provider text,
  insurance_policy text,
  service_area text,
  photo_url text,
  status public.mover_status NOT NULL DEFAULT 'PENDING',
  is_online boolean NOT NULL DEFAULT false,
  rating numeric(3,2) NOT NULL DEFAULT 5.0,
  jobs_completed int NOT NULL DEFAULT 0,
  total_earnings numeric(10,2) NOT NULL DEFAULT 0,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.mover_profiles TO authenticated;
GRANT SELECT ON public.mover_profiles TO anon;
GRANT ALL ON public.mover_profiles TO service_role;
ALTER TABLE public.mover_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movers readable" ON public.mover_profiles FOR SELECT USING (true);
CREATE POLICY "insert own mover profile" ON public.mover_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update own mover profile" ON public.mover_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- VEHICLES
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid REFERENCES public.mover_profiles(id) ON DELETE CASCADE,
  type public.vehicle_type NOT NULL DEFAULT 'PICKUP_TRUCK',
  year int,
  make text,
  model text,
  photo_url text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT ON public.vehicles TO anon;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles readable" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "manage own vehicles" ON public.vehicles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mover_profiles m WHERE m.id = mover_id AND (m.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mover_profiles m WHERE m.id = mover_id AND m.user_id = auth.uid()));

-- MOVER DOCUMENTS
CREATE TABLE public.mover_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_id uuid NOT NULL REFERENCES public.mover_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  url text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mover_documents TO authenticated;
GRANT ALL ON public.mover_documents TO service_role;
ALTER TABLE public.mover_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own documents" ON public.mover_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mover_profiles m WHERE m.id = mover_id AND (m.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mover_profiles m WHERE m.id = mover_id AND m.user_id = auth.uid()));

-- ADDRESSES
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text,
  address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own addresses" ON public.addresses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- JOBS
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL DEFAULT ('HLR-' || upper(substr(md5(random()::text),1,6))),
  customer_user_id uuid,
  customer_name text NOT NULL DEFAULT 'Customer',
  customer_phone text,
  mover_id uuid REFERENCES public.mover_profiles(id) ON DELETE SET NULL,
  mover_user_id uuid,
  pickup_address text NOT NULL,
  dropoff_address text NOT NULL,
  distance_miles numeric(8,2) NOT NULL DEFAULT 0,
  pickup_access text NOT NULL DEFAULT 'GROUND',
  dropoff_access text NOT NULL DEFAULT 'GROUND',
  pickup_flights int NOT NULL DEFAULT 0,
  dropoff_flights int NOT NULL DEFAULT 0,
  parking_available boolean NOT NULL DEFAULT true,
  service_level text NOT NULL DEFAULT 'FULL_SERVICE',
  addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  vehicle_type public.vehicle_type NOT NULL DEFAULT 'PICKUP_TRUCK',
  scheduled_for timestamptz,
  asap boolean NOT NULL DEFAULT true,
  estimated_minutes int NOT NULL DEFAULT 90,
  price_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  customer_price numeric(10,2) NOT NULL DEFAULT 0,
  platform_fee numeric(10,2) NOT NULL DEFAULT 0,
  mover_payout numeric(10,2) NOT NULL DEFAULT 0,
  status public.job_status NOT NULL DEFAULT 'REQUESTED',
  special_instructions text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own or open jobs" ON public.jobs FOR SELECT TO authenticated USING (
  customer_user_id = auth.uid()
  OR mover_user_id = auth.uid()
  OR is_demo = true
  OR status IN ('REQUESTED','SEARCHING')
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "customers create jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (customer_user_id = auth.uid());
CREATE POLICY "update own jobs" ON public.jobs FOR UPDATE TO authenticated USING (
  customer_user_id = auth.uid()
  OR mover_user_id = auth.uid()
  OR status IN ('REQUESTED','SEARCHING')
  OR public.has_role(auth.uid(),'admin')
);

-- JOB ITEMS / PHOTOS / HISTORY
CREATE TABLE public.job_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  size text NOT NULL DEFAULT 'MEDIUM',
  weight_lbs int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_items TO authenticated;
GRANT ALL ON public.job_items TO service_role;
ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job items follow job" ON public.job_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND (j.customer_user_id = auth.uid() OR j.mover_user_id = auth.uid())));

CREATE TABLE public.job_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  url text NOT NULL,
  phase text NOT NULL DEFAULT 'REQUEST',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.job_photos TO authenticated;
GRANT ALL ON public.job_photos TO service_role;
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job photos follow job" ON public.job_photos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND (j.customer_user_id = auth.uid() OR j.mover_user_id = auth.uid())));

CREATE TABLE public.job_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status public.job_status NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.job_status_history TO authenticated;
GRANT ALL ON public.job_status_history TO service_role;
ALTER TABLE public.job_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history follows job" ON public.job_status_history FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id));

-- PAYMENTS / PAYOUTS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  customer_user_id uuid,
  provider text NOT NULL DEFAULT 'stripe_mock',
  provider_payment_id text,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  platform_fee numeric(10,2) NOT NULL DEFAULT 0,
  mover_payout numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own payments" ON public.payments FOR SELECT TO authenticated USING (customer_user_id = auth.uid() OR is_demo = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "create own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (customer_user_id = auth.uid());
CREATE POLICY "update own payments" ON public.payments FOR UPDATE TO authenticated USING (customer_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  mover_id uuid REFERENCES public.mover_profiles(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read payouts" ON public.payouts FOR SELECT TO authenticated USING (is_demo = true OR EXISTS (SELECT 1 FROM public.mover_profiles m WHERE m.id = mover_id AND m.user_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));

-- RATINGS
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  mover_id uuid REFERENCES public.mover_profiles(id) ON DELETE CASCADE,
  customer_user_id uuid,
  stars int NOT NULL DEFAULT 5,
  review text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ratings TO authenticated;
GRANT SELECT ON public.ratings TO anon;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings readable" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "create own rating" ON public.ratings FOR INSERT TO authenticated WITH CHECK (customer_user_id = auth.uid());

-- PRICING
CREATE TABLE public.pricing_rules (
  key text PRIMARY KEY,
  label text NOT NULL,
  value numeric(10,2) NOT NULL,
  unit text NOT NULL DEFAULT '$',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_rules TO anon, authenticated;
GRANT INSERT, UPDATE ON public.pricing_rules TO authenticated;
GRANT ALL ON public.pricing_rules TO service_role;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing readable" ON public.pricing_rules FOR SELECT USING (true);
CREATE POLICY "admins manage pricing" ON public.pricing_rules FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- NOTIFICATIONS / SUPPORT / ADMIN ACTIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  subject text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'OPEN',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_demo = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "create tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid,
  action text NOT NULL,
  target text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins see actions" ON public.admin_actions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins log actions" ON public.admin_actions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SEED PRICING
INSERT INTO public.pricing_rules (key,label,value,unit) VALUES
 ('base_fee','Base fee',45,'$'),
 ('mileage_rate','Mileage rate',2.25,'$/mi'),
 ('labor_rate','Mover labor',35,'$/hr'),
 ('extra_mover_rate','Extra mover',30,'$/hr'),
 ('stair_fee','Stairs',15,'$/flight'),
 ('additional_stop_fee','Additional stop',25,'$'),
 ('heavy_item_fee','Heavy item',25,'$'),
 ('waiting_fee','Waiting time',1,'$/min'),
 ('vehicle_fee_pickup','Pickup truck fee',0,'$'),
 ('vehicle_fee_van','Cargo van fee',20,'$'),
 ('vehicle_fee_box','Box truck fee',45,'$'),
 ('disassembly_fee','Disassembly',20,'$'),
 ('assembly_fee','Assembly',20,'$'),
 ('platform_commission','Platform commission',20,'%');

-- SEED CUSTOMERS
INSERT INTO public.profiles (full_name,email,phone,address,is_demo) VALUES
 ('Maya Robinson','maya.robinson@example.com','(512) 555-0142','1204 E 6th St, Austin, TX',true),
 ('Devon Clark','devon.clark@example.com','(512) 555-0187','908 W 24th St, Austin, TX',true),
 ('Priya Nair','priya.nair@example.com','(512) 555-0119','3300 Duval St, Austin, TX',true),
 ('Sam Whitfield','sam.whitfield@example.com','(512) 555-0163','2101 S Lamar Blvd, Austin, TX',true),
 ('Ana Gutierrez','ana.gutierrez@example.com','(512) 555-0175','1500 Barton Springs Rd, Austin, TX',true),
 ('Tyler Brooks','tyler.brooks@example.com','(512) 555-0198','6700 Manchaca Rd, Austin, TX',true),
 ('Nina Patel','nina.patel@example.com','(512) 555-0121','4501 Guadalupe St, Austin, TX',true),
 ('Chris Donovan','chris.donovan@example.com','(512) 555-0134','1801 E Cesar Chavez St, Austin, TX',true),
 ('Rachel Kim','rachel.kim@example.com','(512) 555-0156','9500 N Lamar Blvd, Austin, TX',true),
 ('Marcus Hall','marcus.hall@example.com','(512) 555-0110','2400 E Oltorf St, Austin, TX',true);

-- SEED MOVERS
INSERT INTO public.mover_profiles (full_name,email,phone,address,license_number,license_state,insurance_provider,insurance_policy,service_area,status,is_online,rating,jobs_completed,total_earnings,is_demo) VALUES
 ('Luis Ramirez','luis.ramirez@example.com','(512) 555-0201','700 E Riverside Dr, Austin, TX','TX-4482910','TX','Progressive Commercial','PC-88213','Austin Metro','APPROVED',true,4.92,184,21460,true),
 ('Jordan Blake','jordan.blake@example.com','(512) 555-0202','1100 S Congress Ave, Austin, TX','TX-9931045','TX','GEICO Commercial','GC-44190','South Austin','APPROVED',true,4.85,132,15230,true),
 ('Tasha Moore','tasha.moore@example.com','(512) 555-0203','5400 Airport Blvd, Austin, TX','TX-2210984','TX','State Farm','SF-77120','North Austin','APPROVED',false,4.97,209,26890,true),
 ('Owen Fitzgerald','owen.f@example.com','(512) 555-0204','8800 Research Blvd, Austin, TX','TX-3390221','TX','Nationwide','NW-31200','Round Rock','APPROVED',true,4.71,88,9840,true),
 ('Kevin Osei','kevin.osei@example.com','(512) 555-0205','2200 Manor Rd, Austin, TX','TX-5567891','TX','Progressive Commercial','PC-55901','East Austin','UNDER_REVIEW',false,5.00,0,0,true),
 ('Brianna Cruz','brianna.cruz@example.com','(512) 555-0206','3701 Bee Caves Rd, Austin, TX','TX-1123456','TX','Allstate','AS-99871','West Austin','PENDING',false,5.00,0,0,true),
 ('Derek Nguyen','derek.nguyen@example.com','(512) 555-0207','12000 N IH-35, Austin, TX','TX-8890123','TX','GEICO Commercial','GC-11220','Pflugerville','APPROVED',true,4.63,61,7120,true),
 ('Sofia Alvarez','sofia.alvarez@example.com','(512) 555-0208','600 W Slaughter Ln, Austin, TX','TX-7745120','TX','State Farm','SF-40021','South Austin','REJECTED',false,5.00,0,0,true);

INSERT INTO public.vehicles (mover_id,type,year,make,model,is_demo)
SELECT m.id, v.type::public.vehicle_type, v.year, v.make, v.model, true
FROM (VALUES
 ('Luis Ramirez','BOX_TRUCK',2021,'Isuzu','NPR'),
 ('Jordan Blake','CARGO_VAN',2020,'Ford','Transit 250'),
 ('Tasha Moore','BOX_TRUCK',2022,'Hino','195'),
 ('Owen Fitzgerald','PICKUP_TRUCK',2019,'Ford','F-150'),
 ('Kevin Osei','CARGO_VAN',2018,'Mercedes-Benz','Sprinter'),
 ('Brianna Cruz','PICKUP_TRUCK',2021,'Toyota','Tundra'),
 ('Derek Nguyen','PICKUP_TRUCK',2023,'Chevrolet','Silverado 2500'),
 ('Sofia Alvarez','CARGO_VAN',2017,'Ram','ProMaster')
) AS v(name,type,year,make,model)
JOIN public.mover_profiles m ON m.full_name = v.name;

-- SEED JOBS
INSERT INTO public.jobs (customer_name,mover_id,mover_user_id,pickup_address,dropoff_address,distance_miles,vehicle_type,service_level,status,customer_price,platform_fee,mover_payout,estimated_minutes,is_demo,created_at,price_breakdown)
SELECT
  c.name, m.id, NULL, c.pickup, c.dropoff, c.miles, c.vt::public.vehicle_type, c.svc, c.st::public.job_status,
  c.price, round(c.price*0.2,2), round(c.price*0.8,2), c.mins, true, now() - (c.days || ' days')::interval,
  jsonb_build_object('base',45,'distance',round(c.miles*2.25,2),'labor',round(c.mins/60.0*35,2),'total',c.price)
FROM (VALUES
 ('Maya Robinson','Luis Ramirez','1204 E 6th St, Austin, TX','4500 Spicewood Springs Rd, Austin, TX',9.4,'BOX_TRUCK','FULL_SERVICE','COMPLETED',189,120,12),
 ('Devon Clark','Jordan Blake','908 W 24th St, Austin, TX','2100 S 1st St, Austin, TX',5.1,'CARGO_VAN','FULL_SERVICE','COMPLETED',134,90,11),
 ('Priya Nair','Tasha Moore','3300 Duval St, Austin, TX','11000 Research Blvd, Austin, TX',8.7,'BOX_TRUCK','ROOM_OF_CHOICE','COMPLETED',221,150,10),
 ('Sam Whitfield','Owen Fitzgerald','2101 S Lamar Blvd, Austin, TX','700 E Ben White Blvd, Austin, TX',3.2,'PICKUP_TRUCK','CURBSIDE','COMPLETED',98,60,9),
 ('Ana Gutierrez','Derek Nguyen','1500 Barton Springs Rd, Austin, TX','13000 N IH-35, Austin, TX',14.6,'PICKUP_TRUCK','FULL_SERVICE','COMPLETED',176,110,8),
 ('Tyler Brooks','Luis Ramirez','6700 Manchaca Rd, Austin, TX','1801 E 51st St, Austin, TX',11.2,'BOX_TRUCK','FULL_SERVICE','COMPLETED',204,135,7),
 ('Nina Patel','Jordan Blake','4501 Guadalupe St, Austin, TX','9300 Burnet Rd, Austin, TX',6.4,'CARGO_VAN','LABOR_ONLY','COMPLETED',112,75,7),
 ('Chris Donovan','Tasha Moore','1801 E Cesar Chavez St, Austin, TX','5900 N Lamar Blvd, Austin, TX',7.8,'BOX_TRUCK','FULL_SERVICE','COMPLETED',167,105,6),
 ('Rachel Kim','Owen Fitzgerald','9500 N Lamar Blvd, Austin, TX','2400 E Oltorf St, Austin, TX',10.3,'PICKUP_TRUCK','CURBSIDE','COMPLETED',149,95,5),
 ('Marcus Hall','Derek Nguyen','2400 E Oltorf St, Austin, TX','1000 W Cesar Chavez St, Austin, TX',4.9,'PICKUP_TRUCK','FULL_SERVICE','COMPLETED',121,80,5),
 ('Maya Robinson','Luis Ramirez','1204 E 6th St, Austin, TX','3300 W Anderson Ln, Austin, TX',8.1,'BOX_TRUCK','FULL_SERVICE','CANCELLED',158,100,4),
 ('Devon Clark','Jordan Blake','908 W 24th St, Austin, TX','6200 S Congress Ave, Austin, TX',9.9,'CARGO_VAN','FULL_SERVICE','IN_TRANSIT',163,105,1),
 ('Priya Nair','Tasha Moore','3300 Duval St, Austin, TX','8000 Shoal Creek Blvd, Austin, TX',5.6,'BOX_TRUCK','ROOM_OF_CHOICE','LOADING',142,95,0),
 ('Sam Whitfield','Owen Fitzgerald','2101 S Lamar Blvd, Austin, TX','4400 S Lamar Blvd, Austin, TX',2.4,'PICKUP_TRUCK','CURBSIDE','MOVER_EN_ROUTE',89,55,0),
 ('Ana Gutierrez','Derek Nguyen','1500 Barton Springs Rd, Austin, TX','2200 Manor Rd, Austin, TX',6.7,'PICKUP_TRUCK','FULL_SERVICE','MOVER_ASSIGNED',131,85,0),
 ('Tyler Brooks',NULL,'6700 Manchaca Rd, Austin, TX','1100 S Congress Ave, Austin, TX',7.3,'CARGO_VAN','FULL_SERVICE','SEARCHING',147,90,0),
 ('Nina Patel',NULL,'4501 Guadalupe St, Austin, TX','12500 N Mopac Expy, Austin, TX',12.8,'BOX_TRUCK','FULL_SERVICE','SEARCHING',218,140,0),
 ('Chris Donovan',NULL,'1801 E Cesar Chavez St, Austin, TX','700 Congress Ave, Austin, TX',3.1,'PICKUP_TRUCK','LABOR_ONLY','SEARCHING',95,60,0),
 ('Rachel Kim',NULL,'9500 N Lamar Blvd, Austin, TX','4200 Airport Blvd, Austin, TX',5.4,'CARGO_VAN','CURBSIDE','SEARCHING',126,80,0),
 ('Marcus Hall','Luis Ramirez','2400 E Oltorf St, Austin, TX','9000 Research Blvd, Austin, TX',13.5,'BOX_TRUCK','FULL_SERVICE','COMPLETED',243,160,3)
) AS c(name,mover,pickup,dropoff,miles,vt,svc,st,price,mins,days)
LEFT JOIN public.mover_profiles m ON m.full_name = c.mover;

INSERT INTO public.job_items (job_id,item_type,quantity,size,weight_lbs)
SELECT j.id, x.t, x.q, x.s, x.w FROM public.jobs j
CROSS JOIN LATERAL (VALUES ('Couch',1,'LARGE',180),('Boxes',6,'SMALL',30)) AS x(t,q,s,w)
WHERE j.is_demo = true;

INSERT INTO public.ratings (job_id,mover_id,stars,review,is_demo)
SELECT j.id, j.mover_id, 5, 'On time, careful with everything. Would book again.', true
FROM public.jobs j WHERE j.is_demo = true AND j.status='COMPLETED' AND j.mover_id IS NOT NULL;

INSERT INTO public.payments (job_id,amount,platform_fee,mover_payout,status,is_demo)
SELECT j.id, j.customer_price, j.platform_fee, j.mover_payout, CASE WHEN j.status='COMPLETED' THEN 'PAID' WHEN j.status='CANCELLED' THEN 'REFUNDED' ELSE 'AUTHORIZED' END, true
FROM public.jobs j WHERE j.is_demo = true;

INSERT INTO public.payouts (job_id,mover_id,amount,status,is_demo)
SELECT j.id, j.mover_id, j.mover_payout, CASE WHEN j.status='COMPLETED' THEN 'PAID' ELSE 'PENDING' END, true
FROM public.jobs j WHERE j.is_demo = true AND j.mover_id IS NOT NULL;
