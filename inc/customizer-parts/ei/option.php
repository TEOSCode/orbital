<?php


final class Orbital_Export_Import_Option extends WP_Customize_Setting
{

	public function import($value)
	{
		$this->update($value);
	}
}
